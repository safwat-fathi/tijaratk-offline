"use client";

import { getCustomerDetailsAction } from "@/actions/customer-actions";
import { formatCurrency } from "@/lib/utils/currency";
import { formatArabicInteger } from "@/lib/utils/number";
import { buildWhatsAppLink } from "@/lib/utils/phone";
import { Customer } from "@/types/models/customer";
import { useEffect, useState } from "react";
import BottomSheet from "@/components/ui/BottomSheet";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface CustomerDetailsSheetProps {
  customerId: number | null;
  onClose: () => void;
}

const customerDetailsCache = new Map<number, Customer>();

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("ar-EG", { month: "short", day: "numeric" });

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
  const waLink = buildWhatsAppLink(customer.phone);

  return (
    <div className="pb-4">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-brand-text">{displayName}</h2>
          <p className="font-medium text-muted-foreground">{customer.phone}</p>
        </div>
        <div className="flex gap-2">
          <a
            href={`tel:${customer.phone}`}
            aria-label="اتصال بالعميل"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft text-brand-primary transition-colors hover:bg-brand-soft/80 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-accent/20"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
          </a>
          <a
            href={waLink || undefined}
            target={waLink ? "_blank" : undefined}
            rel={waLink ? "noreferrer" : undefined}
            aria-disabled={!waLink}
            aria-label="مراسلة العميل على واتساب"
            onClick={(event) => {
              if (!waLink) {
                event.preventDefault();
              }
            }}
            className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-accent/20 ${
              waLink
                ? "bg-brand-soft text-brand-accent hover:bg-brand-soft/80"
                : "cursor-not-allowed bg-muted text-muted-foreground"
            }`}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
          </a>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="rounded-md border border-brand-border bg-brand-soft/50 p-3">
          <span className="text-xs font-medium uppercase text-muted-foreground">إجمالي الطلبات</span>
          <p className="mt-1 text-xl font-bold text-brand-text">
            {formatArabicInteger(customer.order_count) || customer.order_count}
          </p>
        </div>
        <div className="rounded-md border border-brand-border bg-brand-soft/50 p-3">
          <span className="text-xs font-medium uppercase text-muted-foreground">آخر نشاط</span>
          <p className="mt-1 text-xl font-bold text-brand-text">
            {customer.last_order_at ? formatDate(customer.last_order_at) : "غير متوفر"}
          </p>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-bold text-brand-text">أحدث الطلبات</h3>
        {customer.orders && customer.orders.length > 0 ? (
          <div className="space-y-2">
            {customer.orders.slice(0, 5).map((order) => (
              <div key={order.id} className="flex items-center justify-between border-b border-brand-border/60 py-3 last:border-0">
                <div>
                  <p className="text-sm font-medium text-brand-text">طلب رقم {order.id}#</p>
                  <p className="text-xs text-muted-foreground">{formatDate(order.created_at)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-brand-text">
                    {formatCurrency(order.total) || "غير محدد"}
                  </p>
                  <StatusBadge status={order.status} label={resolveOrderStatusLabel(order.status)} className="px-2 py-0.5 text-[10px]" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">لا توجد طلبات.</p>
        )}
      </div>
    </div>
  );
};

export default function CustomerDetailsSheet({
  customerId,
  onClose,
}: CustomerDetailsSheetProps) {
  const initialCachedCustomer = customerId
    ? customerDetailsCache.get(customerId) ?? null
    : null;
  const [customer, setCustomer] = useState<Customer | null>(initialCachedCustomer);
  const [loading, setLoading] = useState(
    customerId ? !initialCachedCustomer : false,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    if (!customerId) {
      return () => {
        isCancelled = true;
      };
    }

    const hasCachedCustomer = customerDetailsCache.has(customerId);

    void (async () => {
      try {
        const response = await getCustomerDetailsAction(customerId);

        if (isCancelled) {
          return;
        }

        if (!response.success || !response.data) {
          if (!hasCachedCustomer) {
            setCustomer(null);
            setError(response.message || "تعذر تحميل بيانات العميل");
          }
          setLoading(false);
          return;
        }

        customerDetailsCache.set(customerId, response.data);
        setCustomer(response.data);
        setError(null);
        setLoading(false);
      } catch {
        if (isCancelled) {
          return;
        }

        if (!hasCachedCustomer) {
          setCustomer(null);
          setError("تعذر تحميل بيانات العميل");
        }
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
    <div className="pb-4">
      <p className="text-sm text-muted-foreground">لا توجد بيانات للعميل.</p>
    </div>
  );

  if (loading) {
    bodyContent = (
      <div className="flex justify-center p-8 text-brand-primary">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  } else if (error) {
    bodyContent = (
      <div className="pb-4">
        <p className="text-sm text-status-error">{error}</p>
      </div>
    );
  } else if (customer) {
    bodyContent = <CustomerBodyContent customer={customer} displayName={displayName} />;
  }

  return (
    <BottomSheet isOpen={Boolean(customerId)} title={displayName} onClose={onClose}>
      {bodyContent}
    </BottomSheet>
  );
}
