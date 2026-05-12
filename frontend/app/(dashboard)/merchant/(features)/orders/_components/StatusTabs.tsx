import { formatArabicInteger } from "@/lib/utils/number";
import { OrderStatus } from "@/types/enums";

interface StatusTabsProps {
  currentStatus: OrderStatus;
  counts: Record<string, number>;
  onTabChange: (status: OrderStatus) => void;
}

export default function StatusTabs({ currentStatus, counts, onTabChange }: StatusTabsProps) {
  const tabs = [
    { id: OrderStatus.DRAFT, label: "جديد", color: "text-status-new bg-status-new/15" },
    { id: OrderStatus.CONFIRMED, label: "مؤكد", color: "text-status-confirmed bg-status-confirmed/15" },
    { id: OrderStatus.OUT_FOR_DELIVERY, label: "التوصيل", color: "text-amber-800 bg-status-delivery/25" },
    { id: OrderStatus.COMPLETED, label: "اكتمل", color: "text-status-completed bg-status-completed/15" },
    { id: OrderStatus.CANCELLED, label: "ملغي", color: "text-status-cancelled bg-status-cancelled/15" },
    {
      id: OrderStatus.REJECTED_BY_CUSTOMER,
      label: "رفض العميل",
      color: "text-status-cancelled bg-status-cancelled/15",
    },
  ];

  return (
    <div className="border-b border-brand-border bg-white">
      <div className="flex overflow-x-auto no-scrollbar px-4 py-2 gap-2">
        {tabs.map((tab) => {
          const isActive = currentStatus === tab.id;
          const count = counts[tab.id] || 0;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id as OrderStatus)}
              className={`
                min-h-11 whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-[background-color,border-color,color,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-accent/20
                flex items-center gap-2 border
                ${isActive
                  ? `${tab.color} border-current ring-1 ring-current`
                  : "bg-white text-brand-text border-brand-border hover:bg-brand-soft/60"}
              `}
            >
              {tab.label}
              {count > 0 && (
                <span className={`
                  text-xs px-1.5 py-0.5 rounded-full
                  ${isActive ? "bg-white/50" : "bg-brand-soft text-muted-foreground"}
                `}>
                  {formatArabicInteger(count) || count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
