import { ordersService } from "@/services/api/orders.service";
import { formatCurrency } from "@/lib/utils/currency";
import Image from "next/image";
import Link from "next/link";
import { OrderStatus } from "@/types/enums";
import TrackingOrderItemsCard from "./_components/TrackingOrderItemsCard";

type Props = {
  params: Promise<{ token: string }>;
};

const TrackingOrdersIcon = () => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="16"
		height="16"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		className="shrink-0 opacity-90"
		aria-hidden="true"
	>
		<path d="M3 7h13" />
		<path d="M3 12h9" />
		<path d="M3 17h6" />
		<circle cx="17" cy="17" r="4" />
		<path d="m19 19-2-2V15" />
	</svg>
);

const StatusBadge = ({ status }: { status: OrderStatus }) => {
  const statusConfig: Record<
		string,
		{ label: string; color: string; icon: React.ReactNode }
	> = {
		[OrderStatus.DRAFT]: {
			label: "قيد المراجعة",
			color: "bg-gray-100 text-gray-700",
			icon: (
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
					<polyline points="14 2 14 8 20 8" />
					<line x1="16" x2="8" y1="13" y2="13" />
					<line x1="16" x2="8" y1="17" y2="17" />
					<line x1="10" x2="8" y1="9" y2="9" />
				</svg>
			),
		},
		[OrderStatus.CONFIRMED]: {
			label: "مؤكد",
			color: "bg-blue-100 text-blue-700",
			icon: (
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
					<path d="m9 12 2 2 4-4" />
				</svg>
			),
		},
		[OrderStatus.OUT_FOR_DELIVERY]: {
			label: "خرج للتوصيل",
			color: "bg-orange-100 text-orange-700",
			icon: (
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<rect width="20" height="14" x="2" y="5" rx="2" />
					<line x1="2" x2="22" y1="10" y2="10" />
					<path d="M13 15h.01" />
					<path d="M17 15h.01" />
				</svg>
			),
		},
		[OrderStatus.COMPLETED]: {
			label: "اكتمل",
			color: "bg-green-100 text-green-700",
			icon: (
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
					<polyline points="22 4 12 14.01 9 11.01" />
				</svg>
			),
		},
		[OrderStatus.CANCELLED]: {
			label: "ملغي",
			color: "bg-red-100 text-red-700",
			icon: (
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<circle cx="12" cy="12" r="10" />
					<line x1="15" x2="9" y1="9" y2="15" />
					<line x1="9" x2="15" y1="9" y2="15" />
				</svg>
			),
		},
		[OrderStatus.REJECTED_BY_CUSTOMER]: {
			label: "مرفوض من العميل",
			color: "bg-rose-100 text-rose-700",
			icon: (
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<circle cx="12" cy="12" r="10" />
					<path d="m15 9-6 6" />
					<path d="m9 9 6 6" />
				</svg>
			),
		},
	};

  const config = statusConfig[status] || statusConfig[OrderStatus.DRAFT];

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${config.color}`}>
      {config.icon}
      {config.label}
    </span>
  );
};

async function getOrder(token: string) {
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

export const metadata = {
	title: "تتبع الطلب",
	description: "تتبع حالة طلبك",
};

export default async function TrackOrder({ params }: Props) {
  const { token } = await params;
  const order = await getOrder(token);

  if (!order) {
    return (
			<div className="rounded-md bg-red-50 p-4 text-center">
				<h3 className="text-sm font-medium text-red-800">
					الطلب غير موجود أو الرابط منتهي الصلاحية.
				</h3>
			</div>
		);
  }

  return (
		<div className="bg-white shadow overflow-hidden sm:rounded-lg">
			<div className="flex items-center gap-2 px-2">
				<Image src="/logo.png" alt="Tijaratk" width={80} height={80} />
				<div className="px-4 py-5 sm:px-6">
					<h3 className="text-lg leading-6 font-medium text-gray-900">
						تفاصيل الطلب {order.tenant?.name && `من ${order.tenant.name}`}
					</h3>
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
						<p className="mt-1 max-w-2xl text-sm text-gray-500">
							رقم التتبع: {order.public_token}
						</p>
						<div className="flex items-center gap-2">
							<Link
								href="/track-orders"
								className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-xs font-medium rounded-full text-slate-700 bg-white hover:bg-slate-50"
							>
								<TrackingOrdersIcon />
								كل طلباتي
							</Link>
							{order.tenant?.slug && (
								<Link
									href={`/${order.tenant.slug}?reorder=${order.public_token}`}
									className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
								>
									إعادة الطلب
								</Link>
							)}
						</div>
					</div>
				</div>
			</div>
			<div className="border-t border-gray-200">
				<dl>
					<div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
						<dt className="text-sm font-medium text-gray-500">الحالة</dt>
						<dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
							<StatusBadge status={order.status as OrderStatus} />
						</dd>
					</div>
					<div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
						<dt className="text-sm font-medium text-gray-500">المتجر</dt>
						<dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
							{order.tenant?.name || "غير متوفر"}
						</dd>
					</div>
					<div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
						<dt className="text-sm font-medium text-gray-500">تاريخ الطلب</dt>
						<dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
							{new Date(order.created_at).toLocaleString("ar-EG")}
						</dd>
					</div>
					<div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
						<dt className="text-sm font-medium text-gray-500">
							المجموع الفرعي
						</dt>
						<dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
							{order.subtotal !== null && order.subtotal !== undefined
								? formatCurrency(Number(order.subtotal) || 0)
								: "السعر يتم تأكيده بعد الطلب"}
						</dd>
					</div>
					<div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
						<dt className="text-sm font-medium text-gray-500">رسوم التوصيل</dt>
						<dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
							{formatCurrency(Number(order.delivery_fee) || 0)}
						</dd>
					</div>
					<div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
						<dt className="text-sm font-medium text-gray-500">الإجمالي</dt>
						<dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0 font-bold">
							{order.total !== null && order.total !== undefined
								? formatCurrency(Number(order.total) || 0)
								: "السعر يتم تأكيده بعد الطلب"}
						</dd>
					</div>
					<div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
						<dt className="text-sm font-medium text-gray-500">العناصر</dt>
						<dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
              {order.items && order.items.length > 0 ? (
                <TrackingOrderItemsCard
                  token={order.public_token}
                  initialOrderStatus={order.status as OrderStatus}
                  initialItems={order.items}
                />
              ) : (
                <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
								<li className="pl-3 pr-4 py-3 text-sm text-gray-700 italic">
									{order.free_text_payload?.text ||
										"لا يوجد عناصر أو ملاحظات"}
								</li>
                </ul>
              )}
						</dd>
					</div>
				</dl>
			</div>
		</div>
	);
}
