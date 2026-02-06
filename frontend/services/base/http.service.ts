import {
	HttpServiceAbstract,
	IPaginatedResponse,
	IParams,
	TMethod,
} from "@/types/services/base";
import {
	getCookieAction,
	getCookiesStringAction,
} from "@/app/actions/cookie-store";

import { STORAGE_KEYS } from "@/constants";
import { createParams } from "@/lib/utils/qs";

// Enhanced response type for better type safety
export interface ServiceResponse<T = unknown> {
	data?: T;
	success: boolean;
	message?: string;
	errors?: unknown[];
}

const DEFAULT_TIMEOUT = 10000;

export default class HttpService<T = unknown> extends HttpServiceAbstract<T> {
	private readonly _baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
	private _token: string | undefined = undefined;
	private readonly _timeout: number;
	private readonly _defaultHeaders: HeadersInit;

	constructor(url: string, timeout = DEFAULT_TIMEOUT) {
		super();

		if (!this._baseUrl) {
			throw new Error("NEXT_PUBLIC_API_BASE_URL is not defined");
		}

		this._baseUrl += url;
		this._timeout = timeout;
		this._defaultHeaders = {
			Accept: "application/json",
		};
	}

	private async _getAuthHeaders(): Promise<HeadersInit> {
		// Always get fresh token from cookies
		this._token = await getCookieAction(STORAGE_KEYS.ACCESS_TOKEN);



		const headers: HeadersInit = {};

		if (this._token) {
			headers["Authorization"] = `Bearer ${this._token.replace(/['"]+/g, "")}`;
		}

		// Forward all cookies in SSR
		if (typeof window === "undefined") {
			const cookies = await getCookiesStringAction();
			if (cookies) {
				headers["Cookie"] = cookies;
			}
		}

		return headers;
	}

	private async _request<R = T>(
		route: string,
		method: TMethod,
		options: RequestInit = {},
		params?: IParams
	): Promise<ServiceResponse<R>> {
		try {
			// Validate base URL is configured
			if (!this._baseUrl || this._baseUrl.startsWith("undefined")) {
				return {
					success: false,
					message:
						"API base URL is not configured. Please set NEXT_PUBLIC_API_BASE_URL in your .env.local file.",
				};
			}

			const authHeaders = await this._getAuthHeaders();
			const urlParams = createParams(params || {});
			const searchParams = urlParams.toString();
			const fullURL = searchParams
				? `${this._baseUrl}/${route}?${searchParams}`
				: `${this._baseUrl}/${route}`;

			// Create a new AbortSignal for each request
			const requestOptions: RequestInit = {
				...options,
				signal: options.signal || AbortSignal.timeout(this._timeout),
				method,
				headers: {
					...this._defaultHeaders,
					...authHeaders,
					...options.headers,
				},
				credentials: "include",
			};

			const response = await fetch(fullURL, requestOptions);
			const responseClone = response.clone();

			// Handle no content
			if (response.status === 204) {
				return { success: true };
			}

			if (!response.ok) {
				let errorBody: string | undefined;

				try {
					errorBody = await responseClone.text();
				} catch (readError) {
					errorBody = `<<failed to read body: ${String(readError)}>>`;
				}

				// Attempt to parse JSON error response
				let errorMessage = response.statusText;
				let errorData = null;
				try {
					const errorJson = JSON.parse(errorBody || "{}");
					errorMessage = errorJson.message || errorMessage;
					errorData = errorJson;
				} catch {
					errorMessage = errorBody || errorMessage;
				}

				return {
					success: false,
					message: errorMessage,
					data: errorData as R, // usage of as R is tricky here but standard for error payloads if they match T
				};
			}

			if (response.status === 401) {
				throw new Error("Unauthorized");
			}

			// Parse response
			const contentType = response.headers.get("content-type");
			const isJson = contentType?.includes("application/json");

			let data: unknown;

			if (isJson) {
				try {
					const rawData: any = await response.json();
					// Unwrap NestJS standard response { success, message, data }
					if (rawData && typeof rawData === "object" && "data" in rawData && "success" in rawData) {
						data = rawData.data;
					} else {
						data = rawData;
					}
				} catch {
					data = null;
				}
			} else {
				data = await response.text();
			}

			return {
				success: true,
				data: data as R,
			};
		} catch (error) {
			return {
				success: false,
				message:
					error instanceof Error ? error.message : "Unknown error occurred",
			};
		}
	}

	private _prepareBody(body: unknown): {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		processedBody: any;
		headers: HeadersInit;
	} {
		if (body instanceof FormData) {
			return {
				processedBody: body,
				headers: {}, // Let browser set Content-Type for FormData
			};
		}

		if (body && typeof body === "object") {
			return {
				processedBody: JSON.stringify(body),
				headers: { "Content-Type": "application/json" },
			};
		}

		return {
			processedBody: body,
			headers: { "Content-Type": "application/json" },
		};
	}

	// Public API methods with consistent return types
	protected async get<R = T>(
		route: string,
		params?: IParams,
		options?: RequestInit
	): Promise<ServiceResponse<R>> {
		return this._request<R>(route, "GET", options, params);
	}

	protected async getList<R = T[]>(
		route: string,
		params?: IParams,
		options?: RequestInit
	): Promise<ServiceResponse<R>> {
		return this._request<R>(route, "GET", options, params);
	}

	protected async post<R = T>(
		route: string,
		body: unknown,
		params?: IParams,
		options?: RequestInit
	): Promise<ServiceResponse<R>> {
		const { processedBody, headers } = this._prepareBody(body);

		return this._request<R>(
			route,
			"POST",
			{
				...options,
				body: processedBody,
				headers: { ...headers, ...options?.headers },
			},
			params
		);
	}

	protected async put<R = T>(
		route: string,
		body: unknown,
		params?: IParams,
		options?: RequestInit
	): Promise<ServiceResponse<R>> {
		const { processedBody, headers } = this._prepareBody(body);

		return this._request<R>(
			route,
			"PUT",
			{
				...options,
				body: processedBody,
				headers: { ...headers, ...options?.headers },
			},
			params
		);
	}

	protected async patch<R = T>(
		route: string,
		body: unknown,
		params?: IParams,
		options?: RequestInit
	): Promise<ServiceResponse<R>> {
		const { processedBody, headers } = this._prepareBody(body);

		return this._request<R>(
			route,
			"PATCH",
			{
				...options,
				body: processedBody,
				headers: { ...headers, ...options?.headers },
			},
			params
		);
	}

	protected async delete<R = T>(
		route: string,
		params?: IParams,
		options?: RequestInit
	): Promise<ServiceResponse<R>> {
		return this._request<R>(route, "DELETE", options, params);
	}

	// Utility method for handling paginated responses
	protected async getPaginated<R = T>(
		route: string,
		params?: IParams,
		options?: RequestInit
	): Promise<ServiceResponse<IPaginatedResponse<R>>> {
		return this._request<IPaginatedResponse<R>>(route, "GET", options, params);
	}
}
