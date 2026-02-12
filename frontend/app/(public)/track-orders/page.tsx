import Link from "next/link";

import { clearTrackedOrdersAction } from "@/actions/order-tracking-actions";
import { formatCurrency } from "@/lib/utils/currency";
import {
	listTrackedOrdersFromCookie,
	type TrackedOrderCookieItem,
} from "@/lib/tracking/customer-tracking-cookie";
import { ordersService } from "@/services/api/orders.service";
import type { Order } from "@/types/models/order";
import { OrderStatus } from "@/types/enums";

export const metadata = {
	title: "طلباتي",
	description: "تابع آخر طلباتك بدون تسجيل دخول",
};

const statusConfig: Record<
	OrderStatus,
	{ label: string; className: string; hint: string }
> = {
	[OrderStatus.DRAFT]: {
		label: "قيد المراجعة",
		className: "bg-slate-100 text-slate-700",
		hint: "المتجر يراجع الطلب حالياً.",
	},
	[OrderStatus.CONFIRMED]: {
		label: "تم التأكيد",
		className: "bg-sky-100 text-sky-700",
		hint: "تم تأكيد الطلب ويجري التجهيز.",
	},
	[OrderStatus.OUT_FOR_DELIVERY]: {
		label: "خرج للتوصيل",
		className: "bg-amber-100 text-amber-700",
		hint: "الطلب في الطريق إليك.",
	},
	[OrderStatus.COMPLETED]: {
		label: "مكتمل",
		className: "bg-emerald-100 text-emerald-700",
		hint: "تم توصيل الطلب بنجاح.",
	},
	[OrderStatus.CANCELLED]: {
		label: "ملغي",
		className: "bg-rose-100 text-rose-700",
		hint: "تم إلغاء الطلب.",
	},
	[OrderStatus.REJECTED_BY_CUSTOMER]: {
		label: "مرفوض من العميل",
		className: "bg-red-100 text-red-700",
		hint: "تم رفض الطلب من العميل.",
	},
};

function formatOrderDate(value?: string) {
	if (!value) return "غير متوفر";
	return new Date(value).toLocaleString("ar-EG");
}

async function getTrackedOrders() {
	const trackedItems = await listTrackedOrdersFromCookie();
	if (trackedItems.length === 0) {
		return { trackedItems, ordersByToken: new Map<string, Order>(), hasError: false };
	}

	const response = await ordersService.getOrdersByPublicTokens(
		trackedItems.map(item => item.token),
	);

	if (!response.success || !response.data) {
		return { trackedItems, ordersByToken: new Map<string, Order>(), hasError: true };
	}

	const ordersByToken = new Map(
		response.data.map(order => [order.public_token, order]),
	);

	return { trackedItems, ordersByToken, hasError: false };
}

function resolveOrder(
	item: TrackedOrderCookieItem,
	ordersByToken: Map<string, Order>,
) {
	return ordersByToken.get(item.token);
}

export default async function TrackOrdersPage() {
	const { trackedItems, ordersByToken, hasError } = await getTrackedOrders();

	return (
		<div className="mx-auto w-full max-w-3xl px-4 py-8">
			<div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-6 shadow-sm">
				<div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-sky-100/60 blur-2xl" />
				<div className="pointer-events-none absolute -bottom-24 -left-20 h-56 w-56 rounded-full bg-emerald-100/50 blur-2xl" />

				<div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
							بدون تسجيل دخول
						</p>
						<h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">
							طلباتي
						</h1>
						<p className="mt-2 text-sm text-slate-600">
							كل طلب جديد ترسله من هذا الجهاز يظهر هنا تلقائياً.
						</p>
					</div>

					<div className="flex items-center gap-2">
						<Link
							href="/"
							className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
						>
							المتاجر
						</Link>
						{trackedItems.length > 0 && (
							<form action={clearTrackedOrdersAction}>
								<button
									type="submit"
									className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
								>
									مسح الطلبات
								</button>
							</form>
						)}
					</div>
				</div>
			</div>

			{hasError && (
				<div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
					تعذر تحميل الطلبات حالياً. أعد المحاولة بعد قليل.
				</div>
			)}

			{trackedItems.length === 0 ? (
				<div className="mt-6 rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
					<div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
							aria-hidden="true"
						>
							<path d="M8 18h8" />
							<path d="M8 14h8" />
							<path d="M8 10h8" />
							<rect width="18" height="20" x="3" y="2" rx="2" />
						</svg>
					</div>
					<h2 className="text-xl font-bold text-slate-900">لا توجد طلبات محفوظة بعد</h2>
					<p className="mt-2 text-sm leading-6 text-slate-600">
						بعد إرسال أول طلب من أي متجر، ستجده هنا مباشرة لتتبع حالته.
					</p>
				</div>
			) : (
				<div className="mt-6 space-y-4">
					{trackedItems.map(item => {
						const order = resolveOrder(item, ordersByToken);
						const status = order?.status ?? OrderStatus.DRAFT;
						const statusMeta = statusConfig[status] ?? statusConfig[OrderStatus.DRAFT];
						const displayDate = order?.created_at ?? item.created_at;
						const storeSlug = order?.tenant?.slug ?? item.slug;
						const storeName = order?.tenant?.name || "المتجر";
						const totalText =
							order?.total !== null && order?.total !== undefined
								? formatCurrency(Number(order.total) || 0)
								: "يتم تأكيد السعر";

						return (
							<article
								key={item.token}
								className="group overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
							>
								<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
									<div>
										<p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
											{storeName}
										</p>
										<h2 className="mt-2 text-lg font-bold text-slate-900">
											طلب بتاريخ {formatOrderDate(displayDate)}
										</h2>
										<p className="mt-1 text-sm text-slate-600">{statusMeta.hint}</p>
										<p className="mt-2 text-xs font-medium text-slate-500">
											رقم التتبع: {item.token}
										</p>
									</div>

									<div className="flex flex-col items-start gap-2 sm:items-end">
										<span
											className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${statusMeta.className}`}
										>
											{statusMeta.label}
										</span>
										<p className="text-sm font-semibold text-slate-900">{totalText}</p>
									</div>
								</div>

								<div className="mt-5 flex flex-col gap-2 sm:flex-row">
									<Link
										href={`/track-order/${item.token}`}
										className="inline-flex flex-1 items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
									>
										تفاصيل التتبع
									</Link>
									<Link
										href={`/${storeSlug}?reorder=${item.token}`}
										className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
									>
										إعادة الطلب
									</Link>
								</div>
							</article>
						);
					})}
				</div>
			)}
		</div>
	);
}
