export const orderProductReplacement = ({
  orderNumber,
  storeName,
  originalProductName,
  replacementProductName,
  orderTotal,
}: {
  orderNumber: string;
  storeName: string;
  originalProductName: string;
  replacementProductName: string;
  orderTotal: number;
}) => `
تم تعديل بعض المنتجات في طلبك رقم ${orderNumber} من متجر ${storeName}.

المنتج الأصلي: ${originalProductName}
المنتج البديل: ${replacementProductName}

إجمالي الطلب بعد التعديل: ${orderTotal} جنيه.

يمكنك الموافقة أو الرفض من خلال رابط تتبع الطلب
`;
