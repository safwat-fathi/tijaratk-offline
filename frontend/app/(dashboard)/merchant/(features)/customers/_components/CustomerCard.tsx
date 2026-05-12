import { Customer } from "@/types/models/customer";
import { buildWhatsAppLink } from "@/lib/utils/phone";
import { formatArabicInteger } from "@/lib/utils/number";

interface CustomerCardProps {
  customer: Customer;
}

export default function CustomerCard({ customer }: CustomerCardProps) {
  // Format stats
  const lastOrderDate = customer.last_order_at 
    ? new Date(customer.last_order_at).toLocaleDateString("ar-EG", { month: "short", day: "numeric" })
    : "أبداً";

  const displayPhone = customer.phone;

  const waLink = buildWhatsAppLink(displayPhone);
  const callLink = `tel:${displayPhone}`;

  return (
    <div className="flex items-center justify-between border-b border-brand-border bg-white p-4 transition-colors active:bg-brand-soft/50">
       <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Avatar */}
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-brand-border bg-brand-soft text-sm font-bold text-brand-primary">
            #{customer.code}
          </div>
          
          <div className="overflow-hidden">
             <div className="flex items-center gap-2">
                 <h3 className="truncate text-base font-bold leading-tight text-brand-text">
                    {customer.merchant_label || customer.name || "غير معروف"}
                 </h3>
             </div>
             {customer.merchant_label && customer.name && (
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{customer.name}</p>
             )}
             <p className="mt-0.5 truncate text-sm font-medium text-muted-foreground" dir="ltr">{displayPhone}</p>
             <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
               <span className="font-semibold text-brand-text">
                 {formatArabicInteger(customer.order_count) || customer.order_count} طلبات
               </span>
               <span>•</span>
               <span>آخر طلب: {lastOrderDate}</span>
             </p>
          </div>
       </div>

       <div className="flex items-center gap-3 shrink-0 ms-2">
          {/* WhatsApp */}
          <a
             href={waLink || undefined}
             target={waLink ? "_blank" : undefined}
             rel={waLink ? "noreferrer" : undefined}
             aria-disabled={!waLink}
             onClick={(e) => {
               e.stopPropagation();
               if (!waLink) {
                 e.preventDefault();
               }
             }}
              className={`flex h-11 w-11 items-center justify-center rounded-full border shadow-sm transition-transform ${
                waLink
                  ? "border-brand-accent/20 bg-brand-soft text-brand-accent active:scale-95"
                  : "cursor-not-allowed border-brand-border bg-muted text-muted-foreground"
              }`}
              aria-label="مراسلة العميل على واتساب"
          >
             <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
          </a>
          
          {/* Call */}
          <a
            href={callLink}
            onClick={(e) => e.stopPropagation()}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-brand-border bg-brand-soft text-brand-primary shadow-sm transition-transform active:scale-95"
            aria-label="اتصال بالعميل"
          >
             <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
          </a>
       </div>
    </div>
  );
}
