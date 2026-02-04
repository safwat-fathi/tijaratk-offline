import { Injectable } from '@nestjs/common';
import { WhatsappService } from 'src/whatsapp/whatsapp.service';
import { Order } from './entities/order.entity';

@Injectable()
export class OrderWhatsappService {
  constructor(private readonly whatsappService: WhatsappService) {}

  async notifySellerNewOrder(order: Order): Promise<void> {
    const sellerNumber = order.tenant?.phone;
    if (!sellerNumber) {
      return;
    }

    const customerName = order.customer?.name || 'عميل';
    const address = order.customer?.address || 'بدون عنوان';

    const baseUrl = process.env.CLIENT_URL;
    const normalizedBaseUrl = baseUrl.replace(/\/$/, '');
    const orderUrl = `${normalizedBaseUrl}/merchant/orders/${order.id}`;

    const message = `📦 *طلب جديد*\n👤 العميل: ${customerName}\n📍 العنوان: ${address}\n${orderUrl}`;

    await this.whatsappService.sendMessage(sellerNumber, message);
  }

  async notifyCustomerConfirmed(
    order: Order,
    trackingUrl: string,
  ): Promise<void> {
    const customerNumber = order.customer?.phone;
    if (!customerNumber) {
      return;
    }
          
    const storeName = order.tenant?.name || 'المحل';
    const message = `تم تأكيد طلبك من ${storeName}\nتابع حالة الطلب من هنا 👇\n${trackingUrl}`;
    await this.whatsappService.sendMessage(customerNumber, message);
  }

  async notifyCustomerOutForDelivery(order: Order): Promise<void> {
    const customerNumber = order.customer?.phone;
    if (!customerNumber) {
      return;
    }

    const storeName = order.tenant?.name || 'المحل';
    const message = `طلبك من ${storeName} في الطريق 🚚`;
    await this.whatsappService.sendMessage(customerNumber, message);
  }

  async notifyCustomerCancelled(order: Order): Promise<void> {
    const customerNumber = order.customer?.phone;
    if (!customerNumber) {
      return;
    }

    const storeName = order.tenant?.name || 'المحل';
    const message = `نأسف، تم إلغاء طلبك من ${storeName} بسبب عدم توفر بعض الأصناف`;
    await this.whatsappService.sendMessage(customerNumber, message);
  }
}
