export const orderConfirmed = ({
  customerName,
  orderId,
  total,
  items,
}: {
  customerName: string;
  orderId: string;
  total: number;
  items: { name: string; qty: string | number }[];
}) => `
*🛒 تم استلام طلبك*

أهلاً _${customerName}_ 👋  
تم استلام طلبك بنجاح.

*رقم الطلب:* \`${orderId}\`
*الإجمالي:* *${total} جنيه*

الطلبات:
${items.map((i) => `- ${i.name} ×${i.qty}`).join('\n')}

شكراً لثقتك 🙏
`;
