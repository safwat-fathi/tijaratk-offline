"use client";

import { Customer } from "@/types/models/customer";
import { useEffect, useState } from "react";
import { customersService } from "@/services/api/customers.service";
import { formatCurrency } from "@/lib/utils/currency";

interface CustomerDetailsSheetProps {
  customerId: number | null;
  onClose: () => void;
}

export default function CustomerDetailsSheet({ customerId, onClose }: CustomerDetailsSheetProps) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (customerId) {
        setLoading(true);
        customersService.getCustomer(customerId)
            .then(res => {
                if (res.success && res.data) {
                    setCustomer(res.data);
                }
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    } else {
        setCustomer(null);
    }
  }, [customerId]);

  if (!customerId) return null;

  const formatDate = (d: string) => new Date(d).toLocaleDateString("ar-EG", { month: "short", day: "numeric" });

  const displayName = customer?.name || customer?.phone || "عميل";
  
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose}>
        <div 
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl animate-slide-up max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
        >
             {/* Handle */}
             <div className="flex justify-center pt-3 pb-2">
                 <div className="w-12 h-1 bg-gray-200 rounded-full"></div>
             </div>

             {loading || !customer ? (
                 <div className="p-8 flex justify-center">
                     <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                     </svg>
                 </div>
             ) : (
                <div className="px-5 pb-8">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{displayName}</h2>
                            <p className="text-gray-500 font-medium">{customer.phone}</p>
                        </div>
                        <div className="flex gap-2">
                             <a href={`tel:${customer.phone}`} className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                             </a>
                             <a href={`https://wa.me/20${customer.phone.replace(/\D/g, '').replace(/^0+/, '')}`} target="_blank" className="w-10 h-10 bg-green-50 text-green-600 rounded-full flex items-center justify-center">
                                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                             </a>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                            <span className="text-gray-400 text-xs font-medium uppercase">إجمالي الطلبات</span>
                            <p className="text-gray-900 text-xl font-bold mt-1">{customer.order_count}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                            <span className="text-gray-400 text-xs font-medium uppercase">آخر نشاط</span>
                            <p className="text-gray-900 text-xl font-bold mt-1">
                                {customer.last_order_at ? formatDate(customer.last_order_at) : 'غير متوفر'}
                            </p>
                        </div>
                    </div>

                    {/* Order History */}
                    <div>
                        <h3 className="font-bold text-gray-900 mb-3 text-sm">أحدث الطلبات</h3>
                        {customer.orders && customer.orders.length > 0 ? (
                            <div className="space-y-2">
                                {customer.orders.slice(0, 5).map((order: any) => (
                                    <div key={order.id} className="flex justify-between items-center py-3 border-b border-gray-50 last:border-0">
                                        <div>
                                            <p className="text-gray-900 font-medium text-sm">طلب رقم {order.id}#</p>
                                            <p className="text-xs text-gray-400">{formatDate(order.created_at)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-gray-900 font-bold text-sm">{formatCurrency(order.total) || "غير محدد"}</p>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                                order.status === 'completed' ? 'bg-green-100 text-green-700' : 
                                                order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                'bg-blue-50 text-blue-700'
                                            }`}>
                                                {order.status === 'completed' ? 'اكتمل' : 
                                                 order.status === 'cancelled' ? 'ملغي' :
                                                 order.status === 'draft' ? 'مسودة' :
                                                 order.status === 'confirmed' ? 'مؤكد' :
                                                 order.status === 'out_for_delivery' ? 'التوصيل' :
                                                 order.status}
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
             )}
        </div>
    </div>
  );
}
