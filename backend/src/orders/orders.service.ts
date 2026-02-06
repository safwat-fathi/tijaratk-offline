import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, Between } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Customer } from 'src/customers/entities/customer.entity';
import { CustomersService } from 'src/customers/customers.service';
import { PricingMode } from 'src/common/enums/pricing-mode.enum';
import { OrderStatus } from 'src/common/enums/order-status.enum';
import { TenantsService } from 'src/tenants/tenants.service';
import { OrderWhatsappService } from './order-whatsapp.service';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemsRepository: Repository<OrderItem>,
    private readonly customersService: CustomersService,
    private readonly tenantsService: TenantsService,
    private readonly orderWhatsappService: OrderWhatsappService,
    private readonly dataSource: DataSource,
  ) {}

  async createForTenantSlug(
    tenantSlug: string,
    createOrderDto: CreateOrderDto,
  ): Promise<Order> {
    const tenant = await this.tenantsService.findOneBySlug(tenantSlug);
    if (!tenant) {
      throw new NotFoundException(`Tenant with slug ${tenantSlug} not found`);
    }

    return this.createForTenantId(tenant.id, createOrderDto);
  }

  async createForTenantId(
    tenantId: number,
    createOrderDto: CreateOrderDto,
  ): Promise<Order> {
    let isFirstOrder = false;

    const savedOrder = await this.dataSource.transaction(async (manager) => {
      // 1. Resolve Customer
      const customer = await this.customersService.findOrCreate(
        createOrderDto.customer.phone,
        tenantId,
        createOrderDto.customer.name,
        createOrderDto.customer.address,
        manager,
      );

      // 2. Determine Pricing Mode & Totals
      let pricingMode = PricingMode.AUTO;
      let subtotal = 0;
      let deliveryFee = createOrderDto.delivery_fee || 0;
      let total = 0;

      const hasItems = createOrderDto.items && createOrderDto.items.length > 0;

      if (createOrderDto.total !== undefined && createOrderDto.total !== null) {
        // Manual total override
        pricingMode = PricingMode.MANUAL;
        total = createOrderDto.total;
        if (hasItems && createOrderDto.items) {
          subtotal = createOrderDto.items.reduce(
            (sum, item) =>
              sum + Number(item.unit_price) * Number(item.quantity),
            0,
          );
        }
      } else {
        // Auto calculation
        if (hasItems && createOrderDto.items) {
          subtotal = createOrderDto.items.reduce(
            (sum, item) =>
              sum + Number(item.unit_price) * Number(item.quantity),
            0,
          );
        }
        total = subtotal + deliveryFee;
      }

      // 3. Create Order
      const order = manager.getRepository(Order).create({
        tenant_id: tenantId,
        customer_id: customer.id,
        order_type: createOrderDto.order_type,
        status: OrderStatus.DRAFT,
        pricing_mode: pricingMode,
        subtotal,
        delivery_fee: deliveryFee,
        total,
        free_text_payload: createOrderDto.free_text_payload,
        notes: createOrderDto.notes,
      });

      const savedOrder = await manager.getRepository(Order).save(order);

      // 4. Create Items
      if (hasItems && createOrderDto.items) {
        const items = createOrderDto.items.map((item) =>
          manager.getRepository(OrderItem).create({
            order: savedOrder,
            product_id: item.product_id,
            title: item.title,
            unit_price: item.unit_price,
            quantity: item.quantity,
            total: Number(item.unit_price) * Number(item.quantity),
          }),
        );
        await manager.getRepository(OrderItem).save(items);
      }

      // 5. Update Customer Stats
      await manager.increment(Customer, { id: customer.id }, 'order_count', 1);
      await manager.update(
        Customer,
        { id: customer.id },
        { last_order_at: new Date() },
      );

      if (customer.order_count === 0) {
        isFirstOrder = true;
      }

      return savedOrder;
    });

    // Notify Seller & Customer
    const completeOrder = await this.findOne(savedOrder.id);
    await this.notifyOrderCreated(completeOrder, isFirstOrder);

    return completeOrder;
  }

  async findAll(tenantId: number, date?: string): Promise<Order[]> {
    const where: any = { tenant_id: tenantId };

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);

      const end = new Date(date);
      end.setHours(23, 59, 59, 999);

      where.created_at = Between(start, end);
    }

    return this.ordersRepository.find({
      where,
      relations: ['customer', 'items'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Order> {
    const order = await this.ordersRepository.findOne({
      where: { id },
      relations: ['customer', 'items', 'tenant'],
    });
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
    return order;
  }

  async update(id: number, updateOrderDto: UpdateOrderDto): Promise<Order> {
    const order = await this.findOne(id);
    const previousStatus = order.status;

    if (updateOrderDto.status && updateOrderDto.status !== previousStatus) {
      this.validateStatusTransition(previousStatus, updateOrderDto.status);
    }

    // Simplistic update for now - just update fields on order
    // Handling item updates requires more logic (diffing etc), skipping for MVP creation focus
    // unless explicitly asked. The prompt mentioned "Allow adding items... later".
    // For now, let's just update the main order fields.

    Object.assign(order, updateOrderDto);

    // Recalculate if total is not manually fixed?
    // If update has total, switch to manual?
    if (updateOrderDto.total !== undefined) {
      order.pricing_mode = PricingMode.MANUAL;
    }

    const savedOrder = await this.ordersRepository.save(order);

    if (updateOrderDto.status && updateOrderDto.status !== previousStatus) {
      await this.notifyCustomerStatusChange(savedOrder);
    }

    return savedOrder;
  }

  async findByPublicToken(token: string): Promise<Order> {
    const order = await this.ordersRepository.findOne({
      where: { public_token: token },
      relations: {
        customer: true,
        items: true,
        tenant: true,
      },
      select: {
        tenant: {
          id: true,
          name: true,
          slug: true,
        },
      },
    });
    if (!order) {
      throw new NotFoundException(`Order with token ${token} not found`);
    }
    return order;
  }

  private validateStatusTransition(
    current: OrderStatus,
    next: OrderStatus,
  ): void {
    if (current === next) {
      return;
    }

    const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.DRAFT]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [
        OrderStatus.OUT_FOR_DELIVERY,
        OrderStatus.CANCELLED,
      ],
      [OrderStatus.OUT_FOR_DELIVERY]: [
        OrderStatus.COMPLETED,
        OrderStatus.CANCELLED,
      ],
      [OrderStatus.COMPLETED]: [],
      [OrderStatus.CANCELLED]: [],
    };

    const allowedNext = allowedTransitions[current] || [];
    if (!allowedNext.includes(next)) {
      throw new BadRequestException(
        `Invalid status transition from ${current} to ${next}`,
      );
    }
  }

  private async notifyOrderCreated(
    order: Order,
    isFirstOrder: boolean,
  ): Promise<void> {
    try {
      // 1. Notify Seller
      await this.orderWhatsappService.notifySellerNewOrder(order);

      // 2. Notify Customer (Order Confirmed)
      const trackingUrl = this.buildTrackingUrl(order.public_token);
      await this.orderWhatsappService.notifyCustomerConfirmed(
        order,
        trackingUrl,
      );

      // 3. Welcome Message (if first order)
      if (isFirstOrder) {
        await this.orderWhatsappService.notifyWelcomeCustomer(order);
      }
    } catch (error) {
      this.logger.warn(`Failed to notify for order ${order.id}`, error);
    }
  }

  private async notifyCustomerStatusChange(order: Order): Promise<void> {
    try {
      const trackingUrl = this.buildTrackingUrl(order.public_token);

      if (order.status === OrderStatus.CONFIRMED) {
        await this.orderWhatsappService.notifyCustomerConfirmed(
          order,
          trackingUrl,
        );
      }

      if (order.status === OrderStatus.OUT_FOR_DELIVERY) {
        await this.orderWhatsappService.notifyCustomerOutForDelivery(order);
      }

      if (order.status === OrderStatus.CANCELLED) {
        await this.orderWhatsappService.notifyCustomerCancelled(order);
      }

      if (order.status === OrderStatus.COMPLETED) {
        await this.orderWhatsappService.notifyCustomerDelivered(order);
      }
    } catch (error) {
      this.logger.warn(
        `Failed to notify customer for order ${order.id} status ${order.status}`,
      );
    }
  }

  private buildTrackingUrl(publicToken: string): string {
    const baseUrl = process.env.APP_URL || 'http://localhost:3000';
    const normalizedBaseUrl = baseUrl.replace(/\/$/, '');
    return `${normalizedBaseUrl}/track-order/${publicToken}`;
  }
}
