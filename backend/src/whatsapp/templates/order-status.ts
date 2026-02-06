export const orderStatusUpdate = ({
  customerName,
  orderId,
  status,
}: {
  customerName: string;
  orderId: string;
  status: string;
}) => `
*📦 تحديث حالة الطلب*

أهلاً _${customerName}_ 👋

طلبك رقم \`${orderId}\`  
حالته الآن: *${status}*

هنوصلك أول ما يحصل أي جديد 🙏
`;
