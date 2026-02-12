import { Injectable } from '@nestjs/common';
import { WhatsappService } from 'src/whatsapp/whatsapp.service';
import { Order } from './entities/order.entity';
import { welcomeCustomer } from 'src/whatsapp/templates';
import { OrderStatus } from 'src/common/enums/order-status.enum';
import { OrderItem } from './entities/order-item.entity';

@Injectable()
export class OrderWhatsappService {
  constructor(private readonly whatsappService: WhatsappService) {}

  private readonly statusLabels: Partial<Record<OrderStatus, string>> = {
    [OrderStatus.CONFIRMED]: 'تم التأكيد',
    [OrderStatus.OUT_FOR_DELIVERY]: 'خرج للتوصيل',
    [OrderStatus.COMPLETED]: 'تم التوصيل',
    [OrderStatus.CANCELLED]: 'تم الإلغاء',
    [OrderStatus.REJECTED_BY_CUSTOMER]: 'تم الرفض من العميل',
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

  /**
   * Sends customer replacement decision request when merchant proposes alternative product.
   */
  async notifyCustomerReplacementRequested(
    order: Order,
    item: OrderItem,
  ): Promise<void> {
    const customerNumber = order.customer_phone || order.customer?.phone;
    if (!customerNumber || !item.pending_replacement_product?.name) return;

    const storeName = order.tenant?.name || 'المتجر';

    await this.whatsappService.sendTemplatedMessage({
      key: 'order_product_replacement',
      to: customerNumber,
      payload: {
        orderNumber: String(order.id),
        storeName,
        originalProductName: item.name_snapshot,
        replacementProductName: item.pending_replacement_product.name,
        orderTotal: Number(order.total || 0),
      },
    });
  }

  /**
   * Sends merchant notification when customer accepts replacement.
   */
  async notifyMerchantReplacementAccepted(
    order: Order,
    item: OrderItem,
  ): Promise<void> {
    const sellerNumber = order.tenant?.phone;
    if (!sellerNumber) return;

    const customerName = order.customer_name || order.customer?.name || 'عميل';
    const replacementName =
      item.replaced_by_product?.name || item.pending_replacement_product?.name;

    if (!replacementName) return;

    await this.whatsappService.sendTemplatedMessage({
      key: 'merchant_replacement_accepted',
      to: sellerNumber,
      payload: {
        orderNumber: `#${order.id}`,
        customerName,
        originalProductName: item.name_snapshot,
        replacementProductName: replacementName,
      },
    });
  }

  /**
   * Sends merchant notification when customer rejects replacement.
   */
  async notifyMerchantReplacementRejected(
    order: Order,
    item: OrderItem,
    reason?: string,
  ): Promise<void> {
    const sellerNumber = order.tenant?.phone;
    if (!sellerNumber) return;

    const customerName = order.customer_name || order.customer?.name || 'عميل';

    await this.whatsappService.sendTemplatedMessage({
      key: 'merchant_replacement_rejected',
      to: sellerNumber,
      payload: {
        orderNumber: `#${order.id}`,
        customerName,
        originalProductName: item.name_snapshot,
        replacementProductName:
          item.pending_replacement_product?.name || 'البديل المقترح',
        reason: reason?.trim() || 'بدون سبب',
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
