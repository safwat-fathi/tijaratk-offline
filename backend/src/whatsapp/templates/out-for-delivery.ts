export const outForDelivery = ({
  customerName,
  orderId,
  driverPhone,
}: {
  customerName: string;
  orderId: string;
  driverPhone?: string;
}) => `
*🚚 الطلب في الطريق*

أهلاً _${customerName}_ 👋

طلبك رقم \`${orderId}\` خرج للتوصيل.
${driverPhone ? `\nرقم المندوب: ${driverPhone}` : ''}

يرجى تجهيز المبلغ عند الاستلام 💵
`;
