import React from "react";

export default function EndOfDayTeaser() {
  return (
    <div className="pt-4 pb-8">
      <div className="rounded-xl border shadow-sm bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/20 p-2 rounded-full">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><line x1="16" x2="16" y1="14" y2="18"/><path d="M16 10h.01"/><path d="M12 10h.01"/><path d="M8 10h.01"/><path d="M12 14h.01"/><path d="M8 14h.01"/><path d="M12 18h.01"/><path d="M8 18h.01"/></svg>
            </div>
            <div>
               <p className="font-medium text-sm text-foreground">إغلاق حساب اليوم؟</p>
               <p className="text-xs text-muted-foreground">احصل على ملخص ليومك</p>
            </div>
          </div>
           <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-3">
            إغلاق اليوم
          </button>
        </div>
      </div>
      
      <p className="text-center text-xs text-muted-foreground mt-4 italic">
        "التجار يهتمون باليوم، ليس التحليلات."
      </p>
    </div>
  );
}
