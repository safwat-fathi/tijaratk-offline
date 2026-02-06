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
*📥 طلب جديد*

*رقم الطلب:* \`${orderId}\`
العميل: ${customerName}
المنطقة: ${area}
الإجمالي: *${total} جنيه*

ادخل الداشبورد لإدارة الطلب.
`;
