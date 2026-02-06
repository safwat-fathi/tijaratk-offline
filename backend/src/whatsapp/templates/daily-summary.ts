export const dailySummary = ({
  date,
  orders,
  totalCash,
  cancelled,
}: {
  date: string;
  orders: number;
  totalCash: number;
  cancelled: number;
}) => `
*📊 ملخص اليوم (${date})*

عدد الطلبات: ${orders}
طلبات ملغية: ${cancelled}
إجمالي النقدي: *${totalCash} جنيه*
`;
