import { Injectable } from '@nestjs/common';
import { WhatsappService } from 'src/whatsapp/whatsapp.service';
import { Order } from './entities/order.entity';
import { orderCancelled, welcomeCustomer } from 'src/whatsapp/templates';

@Injectable()
export class OrderWhatsappService {
  constructor(private readonly whatsappService: WhatsappService) {}

  async notifySellerNewOrder(order: Order): Promise<void> {
    const sellerNumber = order.tenant?.phone;
    if (!sellerNumber) return;

    const customerName = order.customer?.name || 'عميل';
    const area = order.customer?.address || 'غير محدد';
    const total = Number(order.total || 0);

    await this.whatsappService.sendTemplatedMessage({
      key: 'new_order_merchant',
      to: sellerNumber,
      payload: {
        customerName,
        orderNumber: `#${order.id}`,
        area,
        totalEgp: total,
      },
    });
  }

  async notifyCustomerConfirmed(
    order: Order,
    trackingUrl: string,
  ): Promise<void> {
    void trackingUrl;

    const customerNumber = order.customer_phone || order.customer?.phone;
    if (!customerNumber) return;

    const customerName = order.customer_name || order.customer?.name || 'عميل';
    const total = Number(order.total || 0);

    await this.whatsappService.sendTemplatedMessage({
      key: 'order_received_customer',
      to: customerNumber,
      payload: {
        customerName,
        orderNumber: `#${order.id}`,
        totalEgp: total,
      },
    });
  }

  async notifyCustomerOutForDelivery(order: Order): Promise<void> {
    const customerNumber = order.customer_phone || order.customer?.phone;
    if (!customerNumber) return;

    const customerName = order.customer_name || order.customer?.name || 'عميل';

    await this.whatsappService.sendTemplatedMessage({
      key: 'order_out_for_delivery',
      to: customerNumber,
      payload: {
        customerName,
        orderNumber: `#${order.id}`,
      },
    });
  }

  async notifyCustomerCancelled(order: Order): Promise<void> {
    const customerNumber = order.customer_phone || order.customer?.phone;
    if (!customerNumber) return;

    const customerName = order.customer_name || order.customer?.name || 'عميل';

    const message = orderCancelled({
      customerName,
      orderId: `#${order.id}`,
    });

    await this.whatsappService.sendMessage(customerNumber, message);
  }

  async notifyCustomerDelivered(order: Order): Promise<void> {
    const customerNumber = order.customer_phone || order.customer?.phone;
    if (!customerNumber) return;

    const customerName = order.customer_name || order.customer?.name || 'عميل';

    await this.whatsappService.sendTemplatedMessage({
      key: 'order_status_update_customer',
      to: customerNumber,
      payload: {
        customerName,
        orderNumber: `#${order.id}`,
        statusLabel: 'تم التوصيل',
      },
    });
  }

  async notifyWelcomeCustomer(order: Order): Promise<void> {
    const customerNumber = order.customer_phone || order.customer?.phone;
    if (!customerNumber) return;

    const storeName = order.tenant?.name || 'المحل';

    const message = welcomeCustomer({
      storeName,
    });

    await this.whatsappService.sendMessage(customerNumber, message);
  }
}
