"use client";

import { OrderStatus } from "@/types/enums";
import { Order } from "@/types/models/order";
import Link from "next/link";
import { updateOrderStatus } from "@/actions/order-actions";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils/currency";

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit' });
};

interface OrderCardProps {
  order: Order;
  onAction?: (order: Order) => void;
  isHighlighted?: boolean;
}

export default function OrderCard({ order, isHighlighted }: OrderCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Determine primary action label based on status
  const getActionLabel = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.DRAFT:
        return "تأكيد الطلب";
      case OrderStatus.CONFIRMED:
        return "للتوصيل";
      case OrderStatus.OUT_FOR_DELIVERY:
        return "إكمال";
      default:
        return "عرض التفاصيل";
    }
  };

  const getNextStatus = (status: OrderStatus): OrderStatus | null => {
    switch (status) {
      case OrderStatus.DRAFT:
        return OrderStatus.CONFIRMED;
      case OrderStatus.CONFIRMED:
        return OrderStatus.OUT_FOR_DELIVERY;
      case OrderStatus.OUT_FOR_DELIVERY:
        return OrderStatus.COMPLETED;
      default:
        return null;
    }
  };

  const isCompleted = order.status === OrderStatus.COMPLETED;
  const isCancelled = order.status === OrderStatus.CANCELLED;
  const isRejectedByCustomer =
    order.status === OrderStatus.REJECTED_BY_CUSTOMER;
  const nextStatus = getNextStatus(order.status);
  const isActionable =
    !isCompleted && !isCancelled && !isRejectedByCustomer && nextStatus !== null;
  
  // Safe customer access
  const customerName = order.customer?.name || "عميل جديد";

  // Handle action click
  const handleAction = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation
    e.stopPropagation();

    if (!nextStatus || isLoading) return;

    setIsLoading(true);
    try {
      await updateOrderStatus(order.id, nextStatus);
      // Optional: Refresh triggers re-fetch in server components, might need manual update if fully client
      // But page.tsx passes initialOrders, so router.refresh() should re-run page.tsx data fetching?
      // Yes, in Next.js App Router, router.refresh() re-fetches server components.
      router.refresh(); 
    } catch (error) {
      console.error("Action failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderItemsContent = () => {
    if (order.items && order.items.length > 0) {
      return order.items
        .map((item) => {
          const itemName = item.replaced_by_product?.name || item.name_snapshot;
          return `${item.quantity}× ${itemName}`;
        })
        .join(", ");
    }
    
    // Check for free text payload
    if (order.free_text_payload?.text) {
       return <span className="text-gray-900 font-medium">&quot;{order.free_text_payload.text}&quot;</span>;
    }

    return <span className="italic text-gray-400">لا يوجد عناصر (طلب نصي حر)</span>;
  };

  if (!order.id) {
    return (
        <div className="bg-red-50 border-b border-red-100 p-4">
            <p className="text-red-500 font-bold">طلب غير صالح (رقم المعرف مفقود)</p>
            <pre className="text-xs">{JSON.stringify(order, null, 2)}</pre>
        </div>
    );
  }

  return (
    <Link href={`/merchant/orders/${order.id}`} className="block">
      <div className={`
        border-b border-gray-100 active:bg-gray-50 transition-colors p-4 relative
        ${isHighlighted ? 'bg-blue-50 animate-pulse-soft' : 'bg-white'}
      `}>
          {isHighlighted && (
             <div className="absolute start-0 top-0 bottom-0 w-1 bg-blue-500 animate-pulse"></div>
          )}
        {/* Top Row: Customer & Total */}
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-bold text-gray-900 text-base">
              {customerName}
            </h3>
            <span className="text-xs text-gray-500">{formatDate(order.created_at)}</span>
          </div>
          <div className="text-end">
            <span className="block font-bold text-gray-900 text-lg">
              {formatCurrency(order.total) || "غير محدد"}
            </span>
            <span className="text-xs text-gray-400 font-medium">
              {order.pricing_mode === 'manual' ? 'يدوي' : 'نقدي'}
            </span>
          </div>
        </div>

        {/* Middle: Items Preview */}
        <div className="mb-3">
          <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
            {renderItemsContent()}
            {order.notes && (
               <span className="block text-amber-600 text-xs mt-1 font-medium">
                 ملاحظة: {order.notes}
               </span>
            )}
          </p>
        </div>

        {/* Bottom: Action Button (if actionable) */}
        {isActionable && (
          <div className="mt-2">
            <button 
              className={`
                w-full py-2.5 rounded-lg text-sm font-semibold transition-colors flex justify-center items-center
                ${order.status === OrderStatus.DRAFT 
                  ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm" 
                  : "bg-gray-100 text-gray-900 hover:bg-gray-200"}
                ${isLoading ? "opacity-70 cursor-not-allowed" : ""}
              `}
              onClick={handleAction}
              disabled={isLoading}
            >
              {isLoading ? (
                <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                getActionLabel(order.status)
              )}
            </button>
          </div>
        )}
      </div>
    </Link>
  );
}
