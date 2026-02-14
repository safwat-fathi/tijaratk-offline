/**
 * Renders merchant day-closure summary fallback text.
 */
export const merchantDayClosureSummary = ({
  date,
  totalOrders,
  completedOrders,
  cancelledOrders,
  totalSalesEgp,
  totalCollectedEgp,
}: {
  date: string;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalSalesEgp: number;
  totalCollectedEgp: number;
}) => `
ملخص إغلاق اليوم لتاريخ ${date}.

عدد الطلبات: ${totalOrders}
طلبات مكتملة: ${completedOrders}
طلبات ملغاة: ${cancelledOrders}

إجمالي المبيعات: ${totalSalesEgp} جنيه
إجمالي التحصيل: ${totalCollectedEgp} جنيه

يمكنك الإطلاع علي التفاصيل من خلال لوحة التحكم الخاصة بالمتجر.
`;
