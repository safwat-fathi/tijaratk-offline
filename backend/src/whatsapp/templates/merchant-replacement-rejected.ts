export const merchantReplacementRejected = ({
  orderNumber,
  customerName,
  originalProductName,
  replacementProductName,
  reason,
}: {
  orderNumber: string;
  customerName: string;
  originalProductName: string;
  replacementProductName: string;
  reason: string;
}) => `
تم رفض استبدال منتج.

رقم الطلب: ${orderNumber}
العميل: ${customerName}
المنتج الأصلي: ${originalProductName}
البديل المرفوض: ${replacementProductName}
سبب الرفض: ${reason}
`;
