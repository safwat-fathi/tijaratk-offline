import StoreHeader from "./_components/StoreHeader";
import OrderForm from "./_components/OrderForm";

import { tenantsService } from "@/services/api/tenants.service";
import { productsService } from "@/services/api/products.service";
import { ordersService } from "@/services/api/orders.service";

// Types
import { Tenant } from "@/types/models/tenant";
import { Product } from "@/types/models/product";
import { Order } from "@/types/models/order";
import { notFound } from "next/navigation";

// Fetch data
async function getTenant(slug: string): Promise<Tenant | null> {
	const response = await tenantsService.getPublicTenant(slug);

	if (!response.success || !response.data) return null;
	return response.data;
}

async function getProducts(slug: string): Promise<Product[]> {
	const response = await productsService.getPublicProducts(slug);

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
	const products = await getProducts(slug);
	const initialOrder = await getOrder(reorder);

	if (!tenant || !tenant.id) {
		notFound();
	}

	return (
		<div className="w-full max-w-md mx-auto min-h-screen bg-gray-50">
			<StoreHeader tenant={tenant} />

			<div>
				{products.length === 0 && (
					<div className="text-center text-gray-500 my-6 bg-white p-4 rounded-xl border border-gray-100 shadow-sm mx-4">
						<p className="font-medium text-gray-900">لا توجد منتجات بعد.</p>
						<p className="text-sm">فقط اكتب طلبك بالأسفل.</p>
					</div>
				)}

					<OrderForm
						tenantSlug={tenant.slug}
						products={products}
						initialOrder={initialOrder}
					/>
			</div>
		</div>
	);
}
