import Link from "next/link";
import { revalidatePath } from "next/cache";
import { ordersService } from "@/services/api/orders.service";
import { productsService } from "@/services/api/products.service";
import { OrderStatus } from "@/types/enums";
import OrderItemsReplacement from "./_components/OrderItemsReplacement";
import { isNextRedirectError } from "@/lib/auth/navigation-errors";
import { formatCurrency } from "@/lib/utils/currency";

const statusLabelMap: Record<OrderStatus, string> = {
	[OrderStatus.DRAFT]: "جديد",
	[OrderStatus.CONFIRMED]: "مؤكد",
	[OrderStatus.OUT_FOR_DELIVERY]: "خرج للتوصيل",
	[OrderStatus.COMPLETED]: "اكتمل",
	[OrderStatus.CANCELLED]: "ملغي",
	[OrderStatus.REJECTED_BY_CUSTOMER]: "مرفوض من العميل",
};

export const dynamic = "force-dynamic";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	return {
		title: `تفاصيل الطلب #${id}`,
		description: `عرض وتعديل تفاصيل الطلب رقم ${id} وإدارة حالته.`,
	};
}

export default async function OrderDetailsPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;

	const [orderResponse, productsResponse] = await Promise.all([
		ordersService.getOrder(Number(id)),
		productsService.getProducts(),
	]);

	if (!orderResponse.success || !orderResponse.data) {
		return (
			<div className="p-8 text-center text-red-500">
				{orderResponse.message}
			</div>
		);
	}

	const order = orderResponse.data;
	const customer = order.customer || {};
	const products =
		productsResponse.success && productsResponse.data
			? productsResponse.data
			: [];

	async function updateStatus(newStatus: OrderStatus) {
		"use server";

		try {
			await ordersService.updateOrder(Number(id), { status: newStatus });
			revalidatePath(`/merchant/orders/${id}`);
			revalidatePath("/merchant/orders");
		} catch (error) {
			if (isNextRedirectError(error)) {
				throw error;
			}
			console.error("Update failed", error);
		}
	}

	return (
		<div className="flex min-h-screen flex-col bg-gray-50">
			<div className="sticky top-0 z-10 flex items-center gap-3 border-b bg-white px-4 py-3">
				<Link
					href="/merchant/orders"
					className="inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-medium text-gray-600 hover:bg-gray-50"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						strokeWidth={2}
						stroke="currentColor"
						className="h-5 w-5 rtl:rotate-180"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
						/>
					</svg>
					<span className="whitespace-nowrap">الرجوع الى الطلبات</span>
				</Link>

				<h1 className="text-lg font-bold">الطلب #{order.id}</h1>

				<span
					className={`ms-auto rounded-full px-2 py-1 text-xs font-medium tracking-wide
            ${order.status === OrderStatus.DRAFT ? "bg-blue-100 text-blue-800" : ""}
            ${order.status === OrderStatus.CONFIRMED ? "bg-indigo-100 text-indigo-800" : ""}
            ${order.status === OrderStatus.OUT_FOR_DELIVERY ? "bg-amber-100 text-amber-800" : ""}
            ${order.status === OrderStatus.COMPLETED ? "bg-green-100 text-green-800" : ""}
            ${order.status === OrderStatus.CANCELLED ? "bg-red-100 text-red-800" : ""}
            ${order.status === OrderStatus.REJECTED_BY_CUSTOMER ? "bg-rose-100 text-rose-800" : ""}
          `}
				>
					{statusLabelMap[order.status] || order.status}
				</span>
			</div>

			<div className="flex-1 space-y-4 p-4 pb-24">
				<section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
					<h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-500">
						معلومات العميل
					</h2>

					<div className="flex items-center gap-4">
						<div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-lg font-bold text-gray-500">
							{(customer.name?.[0] || "C").toUpperCase()}
						</div>
						<div>
							<p className="font-bold text-gray-900">
								{customer.name || "Unknown"}
							</p>
							<a
								href={`tel:${customer.phone}`}
								className="mt-0.5 text-sm font-medium text-blue-600"
							>
								{customer.phone}
							</a>
						</div>
					</div>

					{customer.address && (
						<div className="mt-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
							📍 {customer.address}
						</div>
					)}
				</section>

				<OrderItemsReplacement
					orderId={order.id}
					orderStatus={order.status}
					initialItems={order.items || []}
					products={products}
				/>

				{order.free_text_payload?.text && (
					<section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
						<h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-500">
							طلب نصي
						</h2>
						<p className="whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-sm text-gray-800">
							{order.free_text_payload.text}
						</p>
					</section>
				)}

				{order.notes && (
					<section className="rounded-xl border border-amber-100 bg-amber-50 p-4 shadow-sm">
						<p className="text-sm text-amber-900">
							<strong>ملاحظة:</strong> {order.notes}
						</p>
					</section>
				)}

				<section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
					<div className="space-y-2">
						<div className="flex justify-between text-sm text-gray-600">
							<span>الإجمالي الفرعي</span>
							<span>
								{order.subtotal !== null && order.subtotal !== undefined
									? formatCurrency(order.subtotal) || "غير محدد"
									: "غير محدد"}
							</span>
						</div>

						<div className="flex justify-between text-sm text-gray-600">
							<span>رسوم التوصيل</span>
							<span>{formatCurrency(order.delivery_fee) || "غير محدد"}</span>
						</div>

						<div className="flex items-end justify-between border-t border-gray-100 pt-3">
							<span className="font-bold text-gray-900">الإجمالي</span>
							<span className="text-xl font-bold text-gray-900">
								{order.total !== null && order.total !== undefined
									? formatCurrency(order.total) || "غير محدد"
									: "غير محدد"}
							</span>
						</div>
					</div>
				</section>
			</div>

			<div className="fixed bottom-0 left-0 right-0 border-t bg-white p-4 pb-8 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
				<div className="mx-auto flex max-w-md gap-3">
					{order.status === OrderStatus.DRAFT && (
						<>
							<form
								action={updateStatus.bind(null, OrderStatus.CANCELLED)}
								className="flex-1"
							>
								<button className="w-full rounded-xl bg-gray-100 py-3 font-bold text-gray-700">
									رفض الطلب
								</button>
							</form>
							<form
								action={updateStatus.bind(null, OrderStatus.CONFIRMED)}
								className="flex-[2]"
							>
								<button className="w-full rounded-xl bg-blue-600 py-3 font-bold text-white shadow-lg shadow-blue-200">
									تأكيد الطلب
								</button>
							</form>
						</>
					)}

					{order.status === OrderStatus.CONFIRMED && (
						<form
							action={updateStatus.bind(null, OrderStatus.OUT_FOR_DELIVERY)}
							className="w-full"
						>
							<button className="w-full rounded-xl bg-amber-500 py-3 font-bold text-white shadow-lg shadow-amber-200">
								تأكيد التوصيل
							</button>
						</form>
					)}

					{order.status === OrderStatus.OUT_FOR_DELIVERY && (
						<form
							action={updateStatus.bind(null, OrderStatus.COMPLETED)}
							className="w-full"
						>
							<button className="w-full rounded-xl bg-green-600 py-3 font-bold text-white shadow-lg shadow-green-200">
								تم التوصيل
							</button>
						</form>
					)}

					{(order.status === OrderStatus.COMPLETED ||
						order.status === OrderStatus.CANCELLED ||
						order.status === OrderStatus.REJECTED_BY_CUSTOMER) && (
						<div className="w-full py-2 text-center font-medium text-gray-500">
							حالة الطلب: {statusLabelMap[order.status] || order.status}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
