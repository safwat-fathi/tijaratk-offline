import StoreHeader, { CATEGORY_BY_VALUE } from "./_components/StoreHeader";

import OrderForm from "./_components/OrderForm";

import { tenantsService } from "@/services/api/tenants.service";
import { productsService } from "@/services/api/products.service";
import { ordersService } from "@/services/api/orders.service";

// Types
import { Tenant } from "@/types/models/tenant";
import {
	Product,
	PublicProductCategory,
	PublicProductsMeta,
} from "@/types/models/product";
import { Order } from "@/types/models/order";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { TENANT_CATEGORIES } from "@/constants";
import { getCustomerProfileBySlugFromCookie } from "@/lib/tracking/customer-tracking-cookie";

type Props = {
	params: Promise<{ slug: string }>;
	searchParams: Promise<{ reorder?: string }>;
};

// Fetch data
async function getTenant(slug: string): Promise<Tenant | null> {
	const response = await tenantsService.getPublicTenant(slug);

	if (!response.success || !response.data) return null;
	return response.data;
}

const EMPTY_PRODUCTS_META: PublicProductsMeta = {
	total: 0,
	page: 1,
	limit: 20,
	last_page: 1,
	has_next: false,
};

async function getInitialProducts(slug: string): Promise<{
	products: Product[];
	meta: PublicProductsMeta;
}> {
	const response = await productsService.getPublicProducts(slug, {
		page: 1,
		limit: 20,
	});

	if (!response.success || !response.data) {
		return {
			products: [],
			meta: EMPTY_PRODUCTS_META,
		};
	}

	return {
		products: response.data.data,
		meta: response.data.meta,
	};
}

async function getPublicCategories(
	slug: string,
): Promise<PublicProductCategory[]> {
	const response = await productsService.getPublicProductCategories(slug);
	if (!response.success || !response.data) return [];
	return response.data;
}

async function getOrder(token?: string): Promise<Order | null> {
	if (!token) return null;
	try {
		const response = await ordersService.getOrderByPublicToken(token);
		if (response.success && response.data) {
			return response.data;
		}
		return null;
	} catch {
		return null;
	}
}

export async function generateMetadata(
	{ params }: Props,
	// parent: ResolvingMetadata,
): Promise<Metadata> {
	const { slug } = await params;

	const tenant = await getTenant(slug);

	if (!tenant) return { title: "" };

	const categoryValue = CATEGORY_BY_VALUE[tenant.category]
		? tenant.category
		: TENANT_CATEGORIES.OTHER.value;
	const categoryLabel = CATEGORY_BY_VALUE[categoryValue].labels.ar;
	return {
		title: tenant.name || "",
		description: categoryLabel,
		openGraph: {
			title: tenant.name || "",
			description: `متجر ${categoryLabel}`,
		},
	};
}

export default async function StorePage({ params, searchParams }: Props) {
	const { slug } = await params;
	const { reorder } = await searchParams;

	const tenant = await getTenant(slug);
	if (!tenant || !tenant.id) {
		notFound();
	}

	const [{ products, meta }, categories, initialOrder, savedCustomerProfile] =
		await Promise.all([
		getInitialProducts(slug),
		getPublicCategories(slug),
		getOrder(reorder),
		getCustomerProfileBySlugFromCookie(tenant.slug),
	]);

	return (
		<div className="w-full max-w-md mx-auto min-h-screen bg-gray-50">
			<StoreHeader tenant={tenant} />
			{/* <WriteOrderFAB /> */}

			<div>
				{products.length === 0 && (
					<div className="text-center text-gray-500 my-6 bg-white p-4 rounded-xl border border-gray-100 shadow-sm mx-4">
						<p className="font-medium text-gray-900">لا توجد منتجات بعد.</p>
						<p className="text-sm">فقط اكتب طلبك بالأسفل.</p>
					</div>
				)}

				<OrderForm
					tenantSlug={tenant.slug}
					initialProducts={products}
					initialProductsMeta={meta}
					initialCategories={categories}
					initialOrder={initialOrder}
					savedCustomerProfile={savedCustomerProfile}
				/>
			</div>
		</div>
	);
}
