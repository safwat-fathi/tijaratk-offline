// import { HttpService } from "@/services/base";
// import type {
// 	CreateStorefrontOrderRequest,
// 	CreateStorefrontOrderResponse,
// 	PublicStorefront,
// 	StoreThemeConfig,
// 	StoreSeo,
// 	StorefrontCategory,
// 	StorefrontProduct,
// 	StorefrontProductListResponse,
// 	StorefrontProductsQuery,
// 	CreateCustomOrderRequest,
// } from "@/types/services/storefront";

// export interface CustomOrderRequestResponse {
// 	id: number;
// 	status: string;
// 	// ... other fields if needed for UI feedback
// }

// /**
//  * StorefrontApiService wraps the anonymous/public storefront endpoints defined
//  * in `public-storefront-endpoints.json`. Every method is typed to mirror the
//  * contract of those endpoints so consuming components can rely on proper intellisense.
//  */
// export class StorefrontApiService extends HttpService {
// 	constructor() {
// 		super("/public/stores");
// 	}

// 	/**
// 	 * GET /public/storefronts/{slug}
// 	 */
// 	public getStorefront(slug: string) {
// 		return this.get<PublicStorefront>(slug);
// 	}

// 	/**
// 	 * GET /public/stores/{slug}/theme
// 	 */
// 	public getStoreTheme(slug: string) {
// 		return this.get<{ config: StoreThemeConfig }>(`${slug}/theme`);
// 	}

// 	/**
// 	 * GET /public/stores/{slug}/seo
// 	 */
// 	public getStoreSeo(slug: string) {
// 		return this.get<StoreSeo>(`${slug}/seo`);
// 	}

// 	/**
// 	 * GET /public/stores/{slug}/categories
// 	 */
// 	public getStoreCategories(slug: string) {
// 		return this.get<StorefrontCategory>(`${slug}/categories`);
// 	}

// 	/**
// 	 * GET /public/storefronts/{slug}/products
// 	 */
// 	public getStorefrontProducts(slug: string, query?: StorefrontProductsQuery) {
// 		return this.get<StorefrontProductListResponse>(`${slug}/products`, query);
// 	}

// 	/**
// 	 * GET /public/storefronts/{slug}/products/{productSlug}
// 	 */
// 	public getStorefrontProduct(slug: string, productSlug: string) {
// 		return this.get<StorefrontProduct>(`${slug}/products/${productSlug}`);
// 	}

// 	/**
// 	 * POST /public/storefronts/{slug}/orders
// 	 */
// 	public createOrder(slug: string, payload: CreateStorefrontOrderRequest) {
// 		return this.post<CreateStorefrontOrderResponse>(`${slug}/orders`, payload);
// 	}

// 	/**
// 	 * POST /public/storefronts/{slug}/custom-orders
// 	 */
// 	public createCustomRequest(slug: string, payload: CreateCustomOrderRequest) {
// 		return this.post<CustomOrderRequestResponse>(
// 			`${slug}/custom-orders`,
// 			payload,
// 		);
// 	}

// 	/**
// 	 * POST /public/stores/{id}/visit
// 	 */
// 	public recordVisit(
// 		storeId: number,
// 		payload: {
// 			userAgent?: string;
// 			referer?: string;
// 			source?: string;
// 			utmSource?: string;
// 		},
// 	) {
// 		return fetch(
// 			`${process.env.NEXT_PUBLIC_API_BASE_URL}/public/stores/${storeId}/visit`,
// 			{
// 				method: "POST",
// 				credentials: "include",
// 				headers: {
// 					"Content-Type": "application/json",
// 				},
// 				body: JSON.stringify(payload),
// 			},
// 		);
// 		// return this.post<unknown>(`${storeId}/visit`, payload, undefined, {
// 		// 	headers: {
// 		// 		"Content-Type": "application/json",
// 		// 	},
// 		// });
// 	}
// }

// export const storefrontApiService = new StorefrontApiService();
