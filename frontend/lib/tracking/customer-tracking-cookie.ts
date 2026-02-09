import { cookies } from "next/headers";

import { STORAGE_KEYS } from "@/constants";

const COOKIE_VERSION = 1;
const MAX_TRACKED_ORDER_ITEMS = 15;
const TRACKING_COOKIE_TTL_DAYS = 90;

export type TrackedOrderCookieItem = {
	token: string;
	slug: string;
	created_at: string;
};

type TrackedOrdersCookiePayload = {
	v: number;
	items: TrackedOrderCookieItem[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function isValidTrackedOrderItem(value: unknown): value is TrackedOrderCookieItem {
	if (!isRecord(value)) {
		return false;
	}

	const token = value.token;
	const slug = value.slug;
	const createdAt = value.created_at;

	return (
		typeof token === "string" &&
		token.trim().length > 0 &&
		typeof slug === "string" &&
		slug.trim().length > 0 &&
		typeof createdAt === "string" &&
		createdAt.trim().length > 0
	);
}

function normalizeTrackedOrderItems(items: TrackedOrderCookieItem[]) {
	const deduped = new Map<string, TrackedOrderCookieItem>();

	for (const item of items) {
		const token = item.token.trim();
		const slug = item.slug.trim();
		const createdAt = item.created_at.trim();

		if (!token || !slug || !createdAt) {
			continue;
		}

		if (!deduped.has(token)) {
			deduped.set(token, {
				token,
				slug,
				created_at: createdAt,
			});
		}
	}

	return Array.from(deduped.values()).slice(0, MAX_TRACKED_ORDER_ITEMS);
}

function parseTrackedOrdersCookie(
	rawCookie?: string,
): TrackedOrdersCookiePayload {
	if (!rawCookie) {
		return { v: COOKIE_VERSION, items: [] };
	}

	try {
		const parsed = JSON.parse(rawCookie) as unknown;
		if (!isRecord(parsed)) {
			return { v: COOKIE_VERSION, items: [] };
		}

		const items = Array.isArray(parsed.items)
			? parsed.items.filter(isValidTrackedOrderItem)
			: [];

		return {
			v: COOKIE_VERSION,
			items: normalizeTrackedOrderItems(items),
		};
	} catch {
		return { v: COOKIE_VERSION, items: [] };
	}
}

async function writeTrackedOrdersCookie(
	payload: TrackedOrdersCookiePayload,
): Promise<void> {
	const cookieStore = await cookies();
	const expiresAt = new Date(
		Date.now() + TRACKING_COOKIE_TTL_DAYS * 24 * 60 * 60 * 1000,
	);

	cookieStore.set(STORAGE_KEYS.CUSTOMER_TRACKED_ORDERS, JSON.stringify(payload), {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		path: "/",
		expires: expiresAt,
	});
}

export async function listTrackedOrdersFromCookie(): Promise<
	TrackedOrderCookieItem[]
> {
	const cookieStore = await cookies();
	const rawCookie = cookieStore.get(STORAGE_KEYS.CUSTOMER_TRACKED_ORDERS)?.value;
	const payload = parseTrackedOrdersCookie(rawCookie);

	return payload.items;
}

export async function appendTrackedOrderToCookie(
	item: TrackedOrderCookieItem,
): Promise<TrackedOrderCookieItem[]> {
	if (!isValidTrackedOrderItem(item)) {
		return listTrackedOrdersFromCookie();
	}

	const existingItems = await listTrackedOrdersFromCookie();
	const nextItems = normalizeTrackedOrderItems([item, ...existingItems]);

	await writeTrackedOrdersCookie({
		v: COOKIE_VERSION,
		items: nextItems,
	});

	return nextItems;
}

export async function clearTrackedOrdersCookie(): Promise<void> {
	const cookieStore = await cookies();
	cookieStore.delete(STORAGE_KEYS.CUSTOMER_TRACKED_ORDERS);
}
