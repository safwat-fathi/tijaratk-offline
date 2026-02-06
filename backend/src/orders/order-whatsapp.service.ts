import { Injectable } from '@nestjs/common';
import { WhatsappService } from 'src/whatsapp/whatsapp.service';
import { Order } from './entities/order.entity';
import {
  newOrderSeller,
  orderConfirmed,
  outForDelivery,
  orderCancelled,
  orderDelivered,
  welcomeCustomer,
} from 'src/whatsapp/templates';

@Injectable()
export class OrderWhatsappService {
  constructor(private readonly whatsappService: WhatsappService) {}

  async notifySellerNewOrder(order: Order): Promise<void> {
    const sellerNumber = order.tenant?.phone;
    if (!sellerNumber) return;

    const customerName = order.customer?.name || 'عميل';
    // const address = order.customer?.address || 'بدون عنوان';
    const area = order.customer?.address || 'غير محدد'; // Mapping address to area for now
    
    // Calculate total if not present (though it should be)
    const total = Number(order.total || 0);

    const message = newOrderSeller({
      orderId: `#${order.id}`,
      customerName,
      area,
      total,
    });

    await this.whatsappService.sendMessage(sellerNumber, message);
  }

  async notifyCustomerConfirmed(
    order: Order,
    trackingUrl: string, // Kept for interface compatibility but template doesn't use it yet? 
    // Wait, orderConfirmed template DOES NOT use trackingUrl in the provided version. 
    // It creates a list of items.
  ): Promise<void> {
    const customerNumber = order.customer_phone || order.customer?.phone;
    if (!customerNumber) return;

    const customerName = order.customer_name || order.customer?.name || 'عميل';
    const items = order.items?.map(i => ({ name: i.title, qty: i.quantity })) || [];
    const total = Number(order.total || 0);

    const message = orderConfirmed({
      customerName,
      orderId: `#${order.id}`,
      total,
      items,
    });

    await this.whatsappService.sendMessage(customerNumber, message);
  }

  async notifyCustomerOutForDelivery(order: Order): Promise<void> {
    const customerNumber = order.customer_phone || order.customer?.phone;
    if (!customerNumber) return;

    const customerName = order.customer_name || order.customer?.name || 'عميل';
    
    const message = outForDelivery({
      customerName,
      orderId: `#${order.id}`,
      // driverPhone: '...' // Optional, we don't have driver info yet
    });

    await this.whatsappService.sendMessage(customerNumber, message);
  }

  async notifyCustomerCancelled(order: Order): Promise<void> {
    const customerNumber = order.customer_phone || order.customer?.phone;
    if (!customerNumber) return;

    const customerName = order.customer_name || order.customer?.name || 'عميل';

    const message = orderCancelled({
      customerName,
      orderId: `#${order.id}`,
      // reason: '...' // Optional
    });

    await this.whatsappService.sendMessage(customerNumber, message);
  }

  async notifyCustomerDelivered(order: Order): Promise<void> {
    const customerNumber = order.customer_phone || order.customer?.phone;
    if (!customerNumber) return;

    const customerName = order.customer_name || order.customer?.name || 'عميل';

    const message = orderDelivered({
      customerName,
      orderId: `#${order.id}`,
    });

    await this.whatsappService.sendMessage(customerNumber, message);
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
