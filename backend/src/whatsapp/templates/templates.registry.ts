import { z } from 'zod';
import { newOrderSeller } from './new-order-seller';
import { orderStatusUpdate } from './order-status';
import { outForDelivery } from './out-for-delivery';

export const templatesRegistry = {
  new_order_merchant: {
    contentSidEnv: 'TWILIO_CONTENT_SID_NEW_ORDER_MERCHANT',
    variables: {
      orderNumber: 1,
      customerName: 2,
      area: 3,
      totalEgp: 4,
    },
    schema: z.object({
      customerName: z.string().trim().min(1),
      orderNumber: z.string().trim().min(1),
      area: z.string().trim().min(1),
      totalEgp: z.number().positive(),
    }),
    fallbackText: (data: {
      customerName: string;
      orderNumber: string;
      area: string;
      totalEgp: number;
    }) =>
      newOrderSeller({
        orderId: data.orderNumber,
        customerName: data.customerName,
        area: data.area,
        total: data.totalEgp,
      }),
  },

  order_received_customer: {
    contentSidEnv: 'TWILIO_CONTENT_SID_ORDER_RECEIVED_CUSTOMER',
    variables: {
      customerName: 1,
      orderNumber: 2,
      totalEgp: 3,
    },
    schema: z.object({
      customerName: z.string().trim().min(1),
      orderNumber: z.string().trim().min(1),
      totalEgp: z.number().positive(),
    }),
    fallbackText: (data: {
      customerName: string;
      orderNumber: string;
      totalEgp: number;
    }) =>
      orderStatusUpdate({
        customerName: data.customerName,
        orderId: data.orderNumber,
        status: `تم استلام طلبك بنجاح. إجمالي الطلب: ${data.totalEgp} جنيه`,
      }),
  },

  order_out_for_delivery: {
    contentSidEnv: 'TWILIO_CONTENT_SID_ORDER_OUT_FOR_DELIVERY',
    variables: {
      customerName: 1,
      orderNumber: 2,
    },
    schema: z.object({
      customerName: z.string().trim().min(1),
      orderNumber: z.string().trim().min(1),
    }),
    fallbackText: (data: { customerName: string; orderNumber: string }) =>
      outForDelivery({
        customerName: data.customerName,
        orderId: data.orderNumber,
      }),
  },

  order_status_update_customer: {
    contentSidEnv: 'TWILIO_CONTENT_SID_ORDER_STATUS_UPDATE_CUSTOMER',
    variables: {
      customerName: 1,
      orderNumber: 2,
      statusLabel: 3,
    },
    schema: z.object({
      customerName: z.string().trim().min(1),
      orderNumber: z.string().trim().min(1),
      statusLabel: z.string().trim().min(1),
    }),
    fallbackText: (data: {
      customerName: string;
      orderNumber: string;
      statusLabel: string;
    }) =>
      orderStatusUpdate({
        customerName: data.customerName,
        orderId: data.orderNumber,
        status: data.statusLabel,
      }),
  },
} as const;

export type TemplateKey = keyof typeof templatesRegistry;

export type TemplatePayload<K extends TemplateKey> = z.infer<
  (typeof templatesRegistry)[K]['schema']
>;

export type TemplateVariables<K extends TemplateKey> =
  (typeof templatesRegistry)[K]['variables'];
