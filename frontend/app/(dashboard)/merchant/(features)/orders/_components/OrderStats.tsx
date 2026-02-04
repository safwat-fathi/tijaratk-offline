"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface OrderStatsProps {
  count: number;
  selectedDate?: string;
}

export default function OrderStats({ count, selectedDate }: OrderStatsProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dateInputRef = useRef<HTMLInputElement>(null);

  // Helper to format label
  const getLabel = () => {
    if (!selectedDate) return "اليوم";
    
    const date = new Date(selectedDate);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "اليوم";
    if (date.toDateString() === yesterday.toDateString()) return "أمس";
    
    return date.toLocaleDateString("ar-EG", { month: "short", day: "numeric" });
  };

  const handleSelect = (option: "today" | "yesterday" | "older") => {
    if (option === "today") {
        router.push("/merchant/orders"); // Reset to default (today)
        setIsOpen(false);
    } else if (option === "yesterday") {
        const y = new Date();
        y.setDate(y.getDate() - 1);
        const yStr = y.toISOString().split("T")[0];
        router.push(`/merchant/orders?date=${yStr}`);
        setIsOpen(false);
    } else if (option === "older") {
        // Trigger native picker
        dateInputRef.current?.showPicker();
        // Don't close yet, wait for change
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val) {
        router.push(`/merchant/orders?date=${val}`);
        setIsOpen(false);
    }
  };

  return (
    <>
        <div className="sticky top-0 z-20 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">الطلبات</h1>
        
        <button 
            onClick={() => setIsOpen(true)}
            className="text-sm font-medium text-gray-500 bg-gray-50 px-3 py-1 rounded-full flex items-center gap-1 active:bg-gray-100 transition-colors"
        >
            <span>{getLabel()}</span>
            <span className="text-gray-300">•</span>
            <span className="text-gray-900 font-bold">{count} طلب</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ms-1 text-gray-400">
                <path d="m6 9 6 6 6-6"/>
            </svg>
        </button>
        </div>

        {/* Hidden Date Input */}
        <input 
            type="date" 
            ref={dateInputRef}
            className="absolute opacity-0 pointer-events-none"
            onChange={handleDateChange}
        />

        {/* Bottom Sheet Backdrop */}
        {isOpen && (
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => setIsOpen(false)}>
                <div 
                    className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-4 shadow-2xl animate-slide-up"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex justify-center mb-4">
                        <div className="w-12 h-1 bg-gray-200 rounded-full"></div>
                    </div>
                    
                    <h3 className="text-gray-500 font-medium mb-4 px-2">طلبات</h3>

                    <div className="space-y-1">
                        <button 
                            onClick={() => handleSelect("today")}
                            className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 flex items-center gap-3"
                        >
                            <span className={`w-2 h-2 rounded-full ${!selectedDate || getLabel() === "اليوم" ? "bg-blue-600" : "bg-transparent border border-gray-300"}`}></span>
                            <span className="text-gray-900 font-medium">اليوم</span>
                        </button>

                        <button 
                            onClick={() => handleSelect("yesterday")}
                            className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 flex items-center gap-3"
                        >
                             <span className={`w-2 h-2 rounded-full ${getLabel() === "أمس" ? "bg-blue-600" : "bg-transparent border border-gray-300"}`}></span>
                            <span className="text-gray-900 font-medium">أمس</span>
                        </button>

                        <button 
                            onClick={() => handleSelect("older")}
                            className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 flex items-center gap-3"
                        >
                             <span className={`w-2 h-2 rounded-full ${getLabel() !== "اليوم" && getLabel() !== "أمس" ? "bg-blue-600" : "bg-transparent border border-gray-300"}`}></span>
                            <span className="text-gray-900 font-medium">طلبات أقدم...</span>
                        </button>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100">
                         <button onClick={() => setIsOpen(false)} className="w-full py-3 text-center text-gray-500 font-medium">
                            إلغاء
                         </button>
                    </div>
                </div>
            </div>
        )}
    </>
  );
}
