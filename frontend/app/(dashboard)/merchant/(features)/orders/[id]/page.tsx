import { ordersService } from "@/services/api/orders.service";
import { OrderStatus } from "@/types/enums";
import { revalidatePath } from "next/cache";
import Link from "next/link";

// Formatter helper
const formatPrice = (amount: number | string | undefined) => {
  const val = Number(amount || 0);
  return new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP' }).format(val);
};

export const dynamic = "force-dynamic";

export default async function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // Fetch Order
  const response = await ordersService.getOrder(Number(id));
  if (!response.success || !response.data) {
     console.error("Failed to fetch order or no data", response);
     return <div className="p-8 text-center text-red-500">Order not found</div>;
  }
  const order = response.data;
  const customer = order.customer || {};

  // Actions
  async function updateStatus(newStatus: OrderStatus) {
    "use server";
    try {
        await ordersService.updateOrder(Number(id), { status: newStatus });
        revalidatePath(`/merchant/orders/${id}`);
        revalidatePath(`/merchant/orders`); // Refresh list as well
    } catch (e) {
        console.error("Update failed", e);
        // In a real app we'd handle error UI
    }
  }

  // --- Components for Actions ---
  // We can use server actions directly in buttons if we put them in a form or use 'bind'
  // But for simple buttons, let's create a small component or just use forms for now to keep it simpleServer

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-4 py-3 border-b flex items-center gap-3 sticky top-0 z-10">
        <Link href="/merchant/orders" className="p-2 -ml-2 text-gray-600">
           {/* Back Icon */}
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
        </Link>
        <h1 className="font-bold text-lg">Order #{order.id}</h1>
        <span className={`ml-auto text-xs px-2 py-1 rounded-full font-medium uppercase tracking-wide
            ${order.status === OrderStatus.DRAFT ? "bg-blue-100 text-blue-800" : ""}
            ${order.status === OrderStatus.CONFIRMED ? "bg-indigo-100 text-indigo-800" : ""}
            ${order.status === OrderStatus.OUT_FOR_DELIVERY ? "bg-amber-100 text-amber-800" : ""}
            ${order.status === OrderStatus.COMPLETED ? "bg-green-100 text-green-800" : ""}
            ${order.status === OrderStatus.CANCELLED ? "bg-red-100 text-red-800" : ""}
        `}>
          {order.status}
        </span>
      </div>

      <div className="flex-1 p-4 space-y-4 pb-24">
        {/* Customer Card */}
        <section className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
           <h2 className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wider">Customer</h2>
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-lg font-bold">
                {(customer.name?.[0] || "C").toUpperCase()}
              </div>
              <div>
                 <p className="font-bold text-gray-900">{customer.name || "Unknown"}</p>
                 <a href={`tel:${customer.phone}`} className="text-blue-600 text-sm font-medium flex items-center gap-1 mt-0.5">
                   {customer.phone}
                 </a>
              </div>
           </div>
           {customer.address && (
             <div className="mt-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                📍 {customer.address}
             </div>
           )}
        </section>

        {/* Items Card */}
        <section className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">Items</h2>
            <div className="space-y-3">
              {order.items && order.items.length > 0 ? (
                order.items.map((item, idx: number) => (
                  <div key={idx} className="flex justify-between items-start py-2 border-b border-gray-50 last:border-0">
                     <div className="flex gap-3">
                        <span className="font-bold text-gray-900 min-w-[20px]">{item.quantity}×</span>
                        <span className="text-gray-800">{item.title}</span>
                     </div>
                     <span className="font-medium text-gray-900">{formatPrice(Number(item.unit_price) * Number(item.quantity))}</span>
                  </div>
                ))
              ) : (
                order.free_text_payload?.text ? (
                    <div className="p-3 bg-gray-50 rounded-lg text-gray-800 whitespace-pre-wrap">
                        {order.free_text_payload.text}
                    </div>
                ) : (
                    <p className="text-gray-400 italic">No items listed</p>
                )
              )}
            </div>
            {order.notes && (
                <div className="mt-4 p-3 bg-amber-50 text-amber-900 text-sm rounded-lg border border-amber-100">
                    <strong>Note:</strong> {order.notes}
                </div>
            )}
        </section>

        {/* Payment Summary */}
        <section className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
           <div className="space-y-2">
             <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
             </div>
             <div className="flex justify-between text-sm text-gray-600">
                <span>Delivery</span>
                <span>{formatPrice(order.delivery_fee)}</span>
             </div>
             <div className="pt-3 border-t border-gray-100 flex justify-between items-end">
                <span className="font-bold text-gray-900">Total</span>
                <span className="font-bold text-xl text-gray-900">{formatPrice(order.total)}</span>
             </div>
           </div>
        </section>
      </div>

      {/* Sticky Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 pb-8 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
         <div className="flex gap-3 max-w-md mx-auto">
            {order.status === OrderStatus.DRAFT && (
               <>
                 <form action={updateStatus.bind(null, OrderStatus.CANCELLED)} className="flex-1">
                    <button className="w-full py-3 rounded-xl font-bold bg-gray-100 text-gray-700">Reject</button>
                 </form>
                 <form action={updateStatus.bind(null, OrderStatus.CONFIRMED)} className="flex-2">
                    <button className="w-full py-3 rounded-xl font-bold bg-blue-600 text-white shadow-lg shadow-blue-200">Confirm Order</button>
                 </form>
               </>
            )}

            {order.status === OrderStatus.CONFIRMED && (
               <form action={updateStatus.bind(null, OrderStatus.OUT_FOR_DELIVERY)} className="w-full">
                  <button className="w-full py-3 rounded-xl font-bold bg-amber-500 text-white shadow-lg shadow-amber-200">Start Delivery</button>
               </form>
            )}

            {order.status === OrderStatus.OUT_FOR_DELIVERY && (
               <form action={updateStatus.bind(null, OrderStatus.COMPLETED)} className="w-full">
                  <button className="w-full py-3 rounded-xl font-bold bg-green-600 text-white shadow-lg shadow-green-200">Mark Completed</button>
               </form>
            )}

            {(order.status === OrderStatus.COMPLETED || order.status === OrderStatus.CANCELLED) && (
                <div className="w-full text-center text-gray-500 font-medium py-2">
                    Order is {order.status}
                </div>
            )}
         </div>
      </div>
    </div>
  );
}
