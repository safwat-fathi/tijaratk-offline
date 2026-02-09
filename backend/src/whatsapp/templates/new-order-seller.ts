export const newOrderSeller = ({
  orderId,
  customerName,
  area,
  total,
}: {
  orderId: string;
  customerName: string;
  area: string;
  total: number;
}) => `
تم تسجيل طلب جديد على حسابك.

رقم الطلب: ${orderId}
اسم العميل: ${customerName}
المنطقة: ${area}
إجمالي المبلغ: ${total} جنيه
`;
