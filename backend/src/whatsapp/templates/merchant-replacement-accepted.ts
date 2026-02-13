export const merchantReplacementAccepted = ({
  orderNumber,
  customerName,
}: {
  orderNumber: string;
  customerName: string;
}) => `
قام العميل بالموافقة على استبدال منتج في الطلب رقم ${orderNumber}.

اسم العميل: ${customerName}

يمكنك استكمال تجهيز الطلب.
`;
