import { Injectable } from '@nestjs/common';
import { WhatsappService } from 'src/whatsapp/whatsapp.service';
import { Order } from './entities/order.entity';
import { welcomeCustomer } from 'src/whatsapp/templates';
import { OrderStatus } from 'src/common/enums/order-status.enum';

@Injectable()
export class OrderWhatsappService {
  constructor(private readonly whatsappService: WhatsappService) {}

  private readonly statusLabels: Partial<Record<OrderStatus, string>> = {
    [OrderStatus.CONFIRMED]: 'تم التأكيد',
    [OrderStatus.OUT_FOR_DELIVERY]: 'خرج للتوصيل',
    [OrderStatus.COMPLETED]: 'تم التوصيل',
    [OrderStatus.CANCELLED]: 'تم الإلغاء',
  };

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
        orderNumber: String(order.id),
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

  async notifyCustomerStatusUpdate(order: Order): Promise<void> {
    const customerNumber = order.customer_phone || order.customer?.phone;
    if (!customerNumber) return;

    const statusLabel = this.statusLabels[order.status];
    if (!statusLabel) return;

    const customerName = order.customer_name || order.customer?.name || 'عميل';

    await this.whatsappService.sendTemplatedMessage({
      key: 'order_status_update_customer',
      to: customerNumber,
      payload: {
        customerName,
        orderNumber: `#${order.id}`,
        statusLabel,
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
