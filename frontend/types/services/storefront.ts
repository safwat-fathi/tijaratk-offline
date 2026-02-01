import type { IPaginatedResponse, IParams } from "@/types/services/base";

export type ProductsLayout = "grid" | "list";

export interface StorefrontThemePalette {
  background?: string;
  surface?: string;
  surfaceMuted?: string;
  accent?: string;
  accentSoft?: string;
  text?: string;
  textMuted?: string;
  border?: string;
}

export interface StoreThemeConfig {
	primaryColor?: string;
	layout?: ProductsLayout;
	palette?: StorefrontThemePalette;
	logo?: string;
	[key: string]: unknown;
}

export const DEFAULT_STORE_THEME: StoreThemeConfig = {
	primaryColor: "#000000",
	layout: "grid",
	palette: {
		background: "#ffffff",
		surface: "#f9fafb",
		surfaceMuted: "#e5e7eb",
		accent: "#000000",
		accentSoft: "#e5e7eb",
		text: "#111827",
		textMuted: "#6b7280",
		border: "#e5e7eb",
	},
	logo: "/logo.png",
};

export interface Category {
	id: number;
	key: string;
	name_en: string;
	name_ar: string;
	suggested_sub_categories: { name_en: string; name_ar: string }[];
}

export interface StorefrontCategory {
	id: number;
	key: string;
	name_en: string;
	name_ar: string;
	parent_id?: number;
	suggested_sub_categories?: { name_en: string; name_ar: string }[];
}

export interface SubCategory {
	id: number;
	storefrontId: number;
	categoryId: number;
	category: Category;
	name: string;
	is_custom: boolean;
}

export interface StoreSeo {
	title?: string;
	description?: string;
	image?: string;
	canonical_url?: string;
	og?: {
		image?: string;
		title?: string;
		description?: string;
	};
	[key: string]: unknown;
}

export interface PublicStorefront {
	id: number;
	slug: string;
	name: string;
	description?: string;

	address_text?: string;
	cover_image_url?: string;
	logo_url?: string;
	storefrontCategory?: any;
	subCategories?: any[];
	theme_config?: StoreThemeConfig;
	seo?: StoreSeo;
	[key: string]: unknown;
}

export interface StorefrontVariant {
	id: string;
	stock: number;
	price: number;
	sale_price?: number;
	sku?: string;
	is_default: boolean;
	is_active: boolean;
}

export interface StorefrontProduct {
	id: number;
	slug: string;
	name: string;
	description?: string;
	image_url?: string;
	main_image?: string;
	images?: string[];
	price?: number;
	currency?: string;
	sku?: string;
	stock?: number;
	created_at?: string;
	updated_at?: string;
	variants?: StorefrontVariant[];
	[key: string]: unknown;
}

export interface StorefrontProductsQuery extends IParams {
	page?: number;
	limit?: number;
	keyword?: string;
}

export type StorefrontProductListResponse =
	IPaginatedResponse<StorefrontProduct>;

export interface StorefrontOrderItem {
	product_id: number | string;
	variant_id?: string;
	quantity: number;
}

export interface CreateStorefrontOrderRequest {
	buyer_name: string;
	whatsapp_number: string;
	buyer_phone?: string;
	buyer_email?: string;
	address_line1: string;
	area: string;
	notes?: string;
	items: StorefrontOrderItem[];
}

export interface CreateStorefrontOrderResponse {
  order_id: string;
  status?: string;
  message?: string;
  [key: string]: unknown;
}

export interface CreateCustomOrderRequest {
	buyer_name: string;
	buyer_phone: string;
	description: string;
	budget?: number;
	images?: string[];
}
