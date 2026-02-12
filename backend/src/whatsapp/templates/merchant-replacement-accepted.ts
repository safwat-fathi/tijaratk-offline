export const merchantReplacementAccepted = ({
  orderNumber,
  customerName,
  originalProductName,
  replacementProductName,
}: {
  orderNumber: string;
  customerName: string;
  originalProductName: string;
  replacementProductName: string;
}) => `
تمت الموافقة على استبدال منتج.

رقم الطلب: ${orderNumber}
العميل: ${customerName}
المنتج الأصلي: ${originalProductName}
البديل المقبول: ${replacementProductName}
`;
