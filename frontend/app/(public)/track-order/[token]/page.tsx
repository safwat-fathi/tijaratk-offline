import { ordersService } from "@/services/api/orders.service";
import { formatCurrency } from "@/lib/utils/currency";
import Image from "next/image";
import { OrderStatus } from "@/types/enums";

type Props = {
  params: Promise<{ token: string }>;
};

const StatusBadge = ({ status }: { status: OrderStatus }) => {
  const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    [OrderStatus.DRAFT]: {
      label: "Draft",
      color: "bg-gray-100 text-gray-700",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>
      )
    },
    [OrderStatus.CONFIRMED]: {
      label: "Confirmed",
      color: "bg-blue-100 text-blue-700",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
      )
    },
    [OrderStatus.OUT_FOR_DELIVERY]: {
      label: "Out for Delivery",
      color: "bg-orange-100 text-orange-700",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/><path d="M13 15h.01"/><path d="M17 15h.01"/></svg>
        // Truck icon alternative or generic package
      )
    },
    [OrderStatus.COMPLETED]: {
      label: "Completed",
      color: "bg-green-100 text-green-700",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
      )
    },
    [OrderStatus.CANCELLED]: {
      label: "Cancelled",
      color: "bg-red-100 text-red-700",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" x2="9" y1="9" y2="15"/><line x1="9" x2="15" y1="9" y2="15"/></svg>
      )
    }
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
  } catch (err) {
    return null;
  }
}

export const metadata = {
	title: "Track Order",
	description: "Track your order",
};

export default async function TrackOrder({ params }: Props) {
  const { token } = await params;
  const order = await getOrder(token);

  if (!order) {
    return (
      <div className="rounded-md bg-red-50 p-4 text-center">
        <h3 className="text-sm font-medium text-red-800">
          Order not found or link expired.
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
						Order Information {order.tenant?.name && `from ${order.tenant.name}`}
					</h3>
					<p className="mt-1 max-w-2xl text-sm text-gray-500">
						Tracking ID: {order.public_token}
					</p>
				</div>
			</div>
			<div className="border-t border-gray-200">
				<dl>
					<div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
						<dt className="text-sm font-medium text-gray-500">Status</dt>
						<dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
							<StatusBadge status={order.status as any} />
						</dd>
					</div>
					<div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
						<dt className="text-sm font-medium text-gray-500">Store</dt>
						<dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
							{order.tenant?.name || "N/A"}
						</dd>
					</div>
					<div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
						<dt className="text-sm font-medium text-gray-500">Date Placed</dt>
						<dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
							{new Date(order.created_at).toLocaleString()}
						</dd>
					</div>
					<div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
						<dt className="text-sm font-medium text-gray-500">Subtotal</dt>
						<dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
							{formatCurrency(Number(order.subtotal) || 0)}
						</dd>
					</div>
					<div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
						<dt className="text-sm font-medium text-gray-500">Delivery Fee</dt>
						<dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
							{formatCurrency(Number(order.delivery_fee) || 0)}
						</dd>
					</div>
					<div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
						<dt className="text-sm font-medium text-gray-500">Total Amount</dt>
						<dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0 font-bold">
							{formatCurrency(Number(order.total) || 0)}
						</dd>
					</div>
					<div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
						<dt className="text-sm font-medium text-gray-500">Items</dt>
						<dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
							<ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
								{order.items && order.items.length > 0 ? (
									order.items.map(item => (
										<li
											key={item.id}
											className="pl-3 pr-4 py-3 flex items-center justify-between text-sm"
										>
											<div className="w-0 flex-1 flex items-center">
												<span className="ml-2 flex-1 w-0 truncate">
													{(item.product_snapshot?.name as string) || "Product"}{" "}
													x {item.quantity}
												</span>
											</div>
											<div className="ml-4 shrink-0">
												{formatCurrency(Number(item.total_price) || 0)}
											</div>
										</li>
									))
								) : (
									<li className="pl-3 pr-4 py-3 text-sm text-gray-700 italic">
										{order.free_text_payload?.text ||
											"No items or notes available"}
									</li>
								)}
							</ul>
						</dd>
					</div>
				</dl>
			</div>
		</div>
	);
}
