export const orderDelivered = ({
  customerName,
  orderId,
}: {
  customerName: string;
  orderId: string;
}) => `
*✅ تم تسليم الطلب*

أهلاً _${customerName}_ 🙌

تم تسليم طلبك رقم \`${orderId}\`.
نتمنى تكون راضي عن الخدمة 💚
`;
