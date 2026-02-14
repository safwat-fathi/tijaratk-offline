import { cookies } from "next/headers";

import { STORAGE_KEYS } from "@/constants";

const COOKIE_VERSION = 1;
const MAX_REQUEST_KEYS = 30;
const COOKIE_TTL_DAYS = 90;
const CAIRO_TIME_ZONE = "Africa/Cairo";

export type AvailabilityStateCookiePayload = {
	v: number;
	visitor_key: string;
	requests_by_key: Record<string, string>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeVisitorKey(value: unknown): string {
	if (typeof value !== "string") {
		return "";
	}

	const normalized = value.trim();
	if (!normalized) {
		return "";
	}

	if (!/^[a-zA-Z0-9_-]{6,64}$/.test(normalized)) {
		return "";
	}

	return normalized;
}

function normalizeDateKey(value: unknown): string {
	if (typeof value !== "string") {
		return "";
	}

	const normalized = value.trim();
	return /^\d{4}-\d{2}-\d{2}$/.test(normalized) ? normalized : "";
}

function normalizeRequestKey(value: string): string {
	const normalized = value.trim();
	if (!normalized || normalized.length > 96) {
		return "";
	}

	return normalized;
}

function pruneRequestsByKey(
	requestsByKey: Record<string, string>,
): Record<string, string> {
	const entries = Object.entries(requestsByKey);
	if (entries.length <= MAX_REQUEST_KEYS) {
		return requestsByKey;
	}

	entries.sort((left, right) => {
		if (left[1] === right[1]) {
			return left[0].localeCompare(right[0]);
		}

		return right[1].localeCompare(left[1]);
	});

	return Object.fromEntries(entries.slice(0, MAX_REQUEST_KEYS));
}

function normalizeRequestsByKey(value: unknown): Record<string, string> {
	if (!isRecord(value)) {
		return {};
	}

	const next: Record<string, string> = {};

	for (const [rawKey, rawValue] of Object.entries(value)) {
		const key = normalizeRequestKey(rawKey);
		const dateKey = normalizeDateKey(rawValue);
		if (!key || !dateKey) {
			continue;
		}

		next[key] = dateKey;
	}

	return pruneRequestsByKey(next);
}

function parseAvailabilityStateCookie(
	rawCookie?: string,
): AvailabilityStateCookiePayload {
	if (!rawCookie) {
		return {
			v: COOKIE_VERSION,
			visitor_key: "",
			requests_by_key: {},
		};
	}

	try {
		const parsed = JSON.parse(rawCookie) as unknown;
		if (!isRecord(parsed)) {
			return {
				v: COOKIE_VERSION,
				visitor_key: "",
				requests_by_key: {},
			};
		}

		return {
			v: COOKIE_VERSION,
			visitor_key: normalizeVisitorKey(parsed.visitor_key),
			requests_by_key: normalizeRequestsByKey(parsed.requests_by_key),
		};
	} catch {
		return {
			v: COOKIE_VERSION,
			visitor_key: "",
			requests_by_key: {},
		};
	}
}

function generateVisitorKey(): string {
	if (typeof globalThis.crypto !== "undefined" && "randomUUID" in globalThis.crypto) {
		return `v_${globalThis.crypto.randomUUID().replace(/-/g, "").slice(0, 24)}`;
	}

	return `v_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

export function getCairoDateKey(date = new Date()): string {
	const parts = new Intl.DateTimeFormat("en-US", {
		timeZone: CAIRO_TIME_ZONE,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).formatToParts(date);

	const year = parts.find((part) => part.type === "year")?.value;
	const month = parts.find((part) => part.type === "month")?.value;
	const day = parts.find((part) => part.type === "day")?.value;

	if (!year || !month || !day) {
		return new Date().toISOString().slice(0, 10);
	}

	return `${year}-${month}-${day}`;
}

function buildRequestKey(slug: string, productId: number): string {
	const normalizedSlug = slug.trim();
	if (!normalizedSlug) {
		throw new Error("slug is required");
	}

	if (!Number.isInteger(productId) || productId <= 0) {
		throw new Error("product_id is invalid");
	}

	return `${normalizedSlug}:${productId}`;
}

export async function readAvailabilityStateCookie(): Promise<AvailabilityStateCookiePayload> {
	const cookieStore = await cookies();
	const rawCookie = cookieStore.get(STORAGE_KEYS.CUSTOMER_AVAILABILITY_STATE)?.value;
	return parseAvailabilityStateCookie(rawCookie);
}

export async function writeAvailabilityStateCookie(
	payload: AvailabilityStateCookiePayload,
): Promise<void> {
	const cookieStore = await cookies();
	const expiresAt = new Date(
		Date.now() + COOKIE_TTL_DAYS * 24 * 60 * 60 * 1000,
	);

	cookieStore.set(
		STORAGE_KEYS.CUSTOMER_AVAILABILITY_STATE,
		JSON.stringify({
			v: COOKIE_VERSION,
			visitor_key: normalizeVisitorKey(payload.visitor_key),
			requests_by_key: pruneRequestsByKey(payload.requests_by_key),
		}),
		{
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			path: "/",
			expires: expiresAt,
		},
	);
}

export async function prepareAvailabilityCookieState(
	slug: string,
	productId: number,
): Promise<{
	visitorKey: string;
	dateKey: string;
	alreadyRequestedToday: boolean;
}> {
	const requestKey = buildRequestKey(slug, productId);
	const payload = await readAvailabilityStateCookie();
	const dateKey = getCairoDateKey();

	const visitorKey = payload.visitor_key || generateVisitorKey();
	const requestsByKey = pruneRequestsByKey({ ...payload.requests_by_key });
	const alreadyRequestedToday = requestsByKey[requestKey] === dateKey;

	const shouldWrite =
		payload.visitor_key !== visitorKey ||
		Object.keys(payload.requests_by_key).length !==
			Object.keys(requestsByKey).length;

	if (shouldWrite) {
		await writeAvailabilityStateCookie({
			v: COOKIE_VERSION,
			visitor_key: visitorKey,
			requests_by_key: requestsByKey,
		});
	}

	return {
		visitorKey,
		dateKey,
		alreadyRequestedToday,
	};
}

export async function markAvailabilityCookieRequestSent(
	slug: string,
	productId: number,
	dateKey?: string,
): Promise<void> {
	const requestKey = buildRequestKey(slug, productId);
	const payload = await readAvailabilityStateCookie();
	const resolvedDateKey = normalizeDateKey(dateKey) || getCairoDateKey();

	await writeAvailabilityStateCookie({
		v: COOKIE_VERSION,
		visitor_key: payload.visitor_key || generateVisitorKey(),
		requests_by_key: {
			...payload.requests_by_key,
			[requestKey]: resolvedDateKey,
		},
	});
}
