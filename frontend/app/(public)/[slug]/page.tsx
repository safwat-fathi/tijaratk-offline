import StoreHeader from "./_components/StoreHeader";
import WriteOrderFAB from "./_components/WriteOrderFAB";
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

async function getPublicCategories(slug: string): Promise<PublicProductCategory[]> {
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

export default async function StorePage({
	params,
	searchParams,
}: {
	params: Promise<{ slug: string }>;
	searchParams: Promise<{ reorder?: string }>;
}) {
	const { slug } = await params;
	const { reorder } = await searchParams;

	const tenant = await getTenant(slug);
	const [{ products, meta }, categories] = await Promise.all([
		getInitialProducts(slug),
		getPublicCategories(slug),
	]);
	const initialOrder = await getOrder(reorder);

	if (!tenant || !tenant.id) {
		notFound();
	}

	return (
		<div className="w-full max-w-md mx-auto min-h-screen bg-gray-50">
			<StoreHeader tenant={tenant} />
			<WriteOrderFAB />

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
				/>
			</div>
		</div>
	);
}
