import { Customer } from "@/types/models/customer";
import { buildWhatsAppLink } from "@/lib/utils/phone";

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
    <div className="bg-white border-b border-gray-100 active:bg-blue-50/30 transition-colors p-4 flex items-center justify-between">
       <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 font-bold flex items-center justify-center shrink-0 border border-blue-100 text-sm">
            #{customer.code}
          </div>
          
          <div className="overflow-hidden">
             <div className="flex items-center gap-2">
                 <h3 className="font-bold text-gray-900 text-base truncate leading-tight">
                    {customer.merchant_label || customer.name || "غير معروف"}
                 </h3>
             </div>
             {customer.merchant_label && customer.name && (
                <p className="text-gray-500 text-xs truncate mt-0.5">{customer.name}</p>
             )}
             <p className="text-gray-500 text-sm truncate font-medium mt-0.5" dir="ltr">{displayPhone}</p>
             <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
               <span className="font-semibold text-gray-600">{customer.order_count} طلبات</span>
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
             className={`w-11 h-11 flex items-center justify-center rounded-full border shadow-sm transition-all ${
               waLink
                 ? "bg-green-50 text-green-600 border-green-100 active:scale-95"
                 : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
             }`}
             aria-label="WhatsApp"
          >
             <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
          </a>
          
          {/* Call */}
          <a
            href={callLink}
            onClick={(e) => e.stopPropagation()}
            className="w-11 h-11 flex items-center justify-center rounded-full bg-blue-50 text-blue-600 border border-blue-100 shadow-sm active:scale-95 transition-all"
            aria-label="Call"
          >
             <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
          </a>
       </div>
    </div>
  );
}
