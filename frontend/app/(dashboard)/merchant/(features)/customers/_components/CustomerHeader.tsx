import { formatArabicInteger } from "@/lib/utils/number";

export default function CustomerHeader({ count }: { count: number }) {
  return (
    <div className="sticky top-0 z-20 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between shadow-sm">
      <div>
        <h1 className="text-xl font-bold text-gray-900">العملاء</h1>
        <p className="text-xs text-gray-500">تم إنشاؤه تلقائياً من الطلبات</p>
      </div>
      <div className="text-sm font-medium text-gray-500 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
         <span className="text-gray-900 font-bold">{formatArabicInteger(count) || count}</span>
         <span className="text-gray-400 ms-1 text-xs">عميل</span>
      </div>
    </div>
  );
}
