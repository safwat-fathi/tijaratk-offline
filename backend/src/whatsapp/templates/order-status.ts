export const orderStatusUpdate = ({
  customerName,
  orderId,
  status,
}: {
  customerName: string;
  orderId: string;
  status: string;
}) => `
تحديث حالة الطلب.

اسم العميل: ${customerName}
رقم الطلب: ${orderId}
حالة الطلب الحالية: ${status}

شكراً لتعاملك معنا.
`;
