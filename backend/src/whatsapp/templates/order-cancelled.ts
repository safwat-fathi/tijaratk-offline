export const orderCancelled = ({
  customerName,
  orderId,
  reason,
}: {
  customerName: string;
  orderId: string;
  reason?: string;
}) => `
*❌ تم إلغاء الطلب*

أهلاً _${customerName}_،

تم إلغاء الطلب رقم \`${orderId}\`.
${reason ? `\nالسبب: _${reason}_` : ''}

لو محتاج أي مساعدة كلمنا في أي وقت.
`;
