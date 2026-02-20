"use client";

import { getCustomerDetailsAction } from "@/actions/customer-actions";
import { useBodyScrollLock } from "@/lib/hooks/useBodyScrollLock";
import { formatCurrency } from "@/lib/utils/currency";
import { Customer } from "@/types/models/customer";
import { useEffect, useState } from "react";

interface CustomerDetailsSheetProps {
  customerId: number | null;
  onClose: () => void;
}

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("ar-EG", { month: "short", day: "numeric" });

const resolveOrderStatusClasses = (status: string) => {
  if (status === "completed") {
    return "bg-green-100 text-green-700";
  }

  if (status === "cancelled") {
    return "bg-red-100 text-red-700";
  }

  if (status === "rejected_by_customer") {
    return "bg-rose-100 text-rose-700";
  }

  return "bg-blue-50 text-blue-700";
};

const resolveOrderStatusLabel = (status: string) => {
  if (status === "completed") {
    return "اكتمل";
  }

  if (status === "cancelled") {
    return "ملغي";
  }

  if (status === "rejected_by_customer") {
    return "مرفوض من العميل";
  }

  if (status === "draft") {
    return "مسودة";
  }

  if (status === "confirmed") {
    return "مؤكد";
  }

  if (status === "out_for_delivery") {
    return "التوصيل";
  }

  return status;
};

const CustomerBodyContent = ({
  customer,
  displayName,
}: {
  customer: Customer;
  displayName: string;
}) => {
  const whatsappPhone = customer.phone.replace(/\D/g, "").replace(/^0+/, "");

  return (
    <div className="px-5 pb-8">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{displayName}</h2>
          <p className="text-gray-500 font-medium">{customer.phone}</p>
        </div>
        <div className="flex gap-2">
          <a
            href={`tel:${customer.phone}`}
            className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
          </a>
          <a
            href={`https://wa.me/20${whatsappPhone}`}
            target="_blank"
            rel="noreferrer"
            className="w-10 h-10 bg-green-50 text-green-600 rounded-full flex items-center justify-center"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
          </a>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
          <span className="text-gray-400 text-xs font-medium uppercase">إجمالي الطلبات</span>
          <p className="text-gray-900 text-xl font-bold mt-1">{customer.order_count}</p>
        </div>
        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
          <span className="text-gray-400 text-xs font-medium uppercase">آخر نشاط</span>
          <p className="text-gray-900 text-xl font-bold mt-1">
            {customer.last_order_at ? formatDate(customer.last_order_at) : "غير متوفر"}
          </p>
        </div>
      </div>

      <div>
        <h3 className="font-bold text-gray-900 mb-3 text-sm">أحدث الطلبات</h3>
        {customer.orders && customer.orders.length > 0 ? (
          <div className="space-y-2">
            {customer.orders.slice(0, 5).map((order) => (
              <div key={order.id} className="flex justify-between items-center py-3 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-gray-900 font-medium text-sm">طلب رقم {order.id}#</p>
                  <p className="text-xs text-gray-400">{formatDate(order.created_at)}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-900 font-bold text-sm">
                    {formatCurrency(order.total) || "غير محدد"}
                  </p>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${resolveOrderStatusClasses(order.status)}`}
                  >
                    {resolveOrderStatusLabel(order.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm italic">لا توجد طلبات.</p>
        )}
      </div>
    </div>
  );
};

export default function CustomerDetailsSheet({
  customerId,
  onClose,
}: CustomerDetailsSheetProps) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useBodyScrollLock(Boolean(customerId));

  useEffect(() => {
    let isCancelled = false;

    if (!customerId) {
      return () => {
        isCancelled = true;
      };
    }

    void (async () => {
      try {
        const response = await getCustomerDetailsAction(customerId);

        if (isCancelled) {
          return;
        }

        if (!response.success || !response.data) {
          setCustomer(null);
          setError(response.message || "تعذر تحميل بيانات العميل");
          setLoading(false);
          return;
        }

        setCustomer(response.data);
        setError(null);
        setLoading(false);
      } catch {
        if (isCancelled) {
          return;
        }

        setCustomer(null);
        setError("تعذر تحميل بيانات العميل");
        setLoading(false);
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [customerId]);

  if (!customerId) return null;

  const displayName = customer?.name || customer?.phone || "عميل";
  let bodyContent = (
    <div className="px-5 pb-8">
      <p className="text-sm text-gray-500">لا توجد بيانات للعميل.</p>
    </div>
  );

  if (loading) {
    bodyContent = (
      <div className="p-8 flex justify-center">
        <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  } else if (error) {
    bodyContent = (
      <div className="px-5 pb-8">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  } else if (customer) {
    bodyContent = <CustomerBodyContent customer={customer} displayName={displayName} />;
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute bottom-0 left-0 right-0 flex max-h-[85dvh] flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl animate-slide-up"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="shrink-0 flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-gray-200 rounded-full"></div>
        </div>

        <div
          className="flex-1 overflow-y-auto overscroll-contain"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {bodyContent}
        </div>
      </div>
    </div>
  );
}
