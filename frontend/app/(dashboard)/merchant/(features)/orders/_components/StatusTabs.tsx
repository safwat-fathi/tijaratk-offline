import { OrderStatus } from "@/types/enums";

interface StatusTabsProps {
  currentStatus: OrderStatus;
  counts: Record<string, number>;
  onTabChange: (status: OrderStatus) => void;
}

export default function StatusTabs({ currentStatus, counts, onTabChange }: StatusTabsProps) {
  const tabs = [
    { id: OrderStatus.DRAFT, label: "جديد", color: "text-blue-600 bg-blue-50" }, // Draft maps to New in UX
    { id: OrderStatus.CONFIRMED, label: "مؤكد", color: "text-indigo-600 bg-indigo-50" },
    { id: OrderStatus.OUT_FOR_DELIVERY, label: "التوصيل", color: "text-amber-600 bg-amber-50" },
    { id: OrderStatus.COMPLETED, label: "اكتمل", color: "text-green-600 bg-green-50" },
    { id: OrderStatus.CANCELLED, label: "ملغي", color: "text-gray-600 bg-gray-50" },
  ];

  return (
    <div className="border-b border-gray-100 bg-white">
      <div className="flex overflow-x-auto no-scrollbar px-4 py-2 gap-2">
        {tabs.map((tab) => {
          const isActive = currentStatus === tab.id;
          const count = counts[tab.id] || 0;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id as OrderStatus)}
              className={`
                whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all
                flex items-center gap-2 border
                ${isActive 
                  ? `${tab.color} border-current ring-1 ring-current` 
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}
              `}
            >
              {tab.label}
              {count > 0 && (
                <span className={`
                  text-xs px-1.5 py-0.5 rounded-full
                  ${isActive ? "bg-white/50" : "bg-gray-100 text-gray-500"}
                `}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
