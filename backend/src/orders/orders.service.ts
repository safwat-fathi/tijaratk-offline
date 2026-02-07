import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, DataSource, DeepPartial, In, Repository } from 'typeorm';
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
import { Product } from 'src/products/entities/product.entity';
import { ProductStatus } from 'src/common/enums/product-status.enum';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemsRepository: Repository<OrderItem>,
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
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

  /**
   * Creates an order and items while preserving historical snapshots.
   */
  async createForTenantId(
    tenantId: number,
    createOrderDto: CreateOrderDto,
  ): Promise<Order> {
    let isFirstOrder = false;

    const savedOrder = await this.dataSource.transaction(async (manager) => {
      const customer = await this.customersService.findOrCreate(
        createOrderDto.customer.phone,
        tenantId,
        createOrderDto.customer.name,
        createOrderDto.customer.address,
        manager,
      );

      const hasItems = Boolean(createOrderDto.items?.length);
      const items = createOrderDto.items || [];

      const productIds = Array.from(
        new Set(
          items
            .map((item) => item.product_id)
            .filter((id): id is number => typeof id === 'number'),
        ),
      );

      const products = productIds.length
        ? await manager.getRepository(Product).find({
            where: {
              id: In(productIds),
              tenant_id: tenantId,
              status: ProductStatus.ACTIVE,
            },
          })
        : [];

      const productsById = new Map(products.map((product) => [product.id, product]));

      const deliveryFee = createOrderDto.delivery_fee || 0;
      let subtotal: number | undefined;
      let total: number | undefined;
      let pricingMode = PricingMode.MANUAL;

      const orderPayload: DeepPartial<Order> = {
        tenant_id: tenantId,
        customer_id: customer.id,
        public_token: randomUUID(),
        order_type: createOrderDto.order_type,
        status: OrderStatus.DRAFT,
        pricing_mode: pricingMode,
        delivery_fee: deliveryFee,
        free_text_payload: createOrderDto.free_text_payload,
        notes: createOrderDto.notes,
      };

      const orderRepository = manager.getRepository(Order);
      const orderEntity = orderRepository.create(orderPayload);
      const persistedOrder = await orderRepository.save(orderEntity);

      if (hasItems) {
        const orderItemsPayload: DeepPartial<OrderItem>[] = items.map((item) => {
          const matchedProduct = item.product_id
            ? productsById.get(item.product_id)
            : undefined;

          const quantityText = String(item.quantity).trim();
          const lineTotal = this.resolveItemTotal(
            quantityText,
            item.unit_price,
            item.total_price,
          );

          return {
            order_id: persistedOrder.id,
            product_id: matchedProduct?.id,
            name_snapshot:
              item.name?.trim() || matchedProduct?.name || 'منتج غير محدد',
            quantity: quantityText,
            unit_price: item.unit_price ?? null,
            total_price: lineTotal,
            notes: item.notes,
          };
        });

        const orderItems = await manager
          .getRepository(OrderItem)
          .save(orderItemsPayload);

        const pricedLines = orderItems
          .map((item) => (item.total_price !== null ? Number(item.total_price) : null))
          .filter((value): value is number => value !== null && !Number.isNaN(value));

        if (pricedLines.length > 0) {
          subtotal = this.roundCurrency(
            pricedLines.reduce((sum, lineTotal) => sum + lineTotal, 0),
          );
        }
      }

      if (createOrderDto.total !== undefined && createOrderDto.total !== null) {
        pricingMode = PricingMode.MANUAL;
        total = Number(createOrderDto.total);
      } else if (subtotal !== undefined) {
        pricingMode = PricingMode.AUTO;
        total = this.roundCurrency(subtotal + Number(deliveryFee));
      } else if (deliveryFee > 0) {
        pricingMode = PricingMode.MANUAL;
        total = Number(deliveryFee);
      } else {
        pricingMode = PricingMode.MANUAL;
        total = undefined;
      }

      persistedOrder.pricing_mode = pricingMode;
      persistedOrder.subtotal = subtotal;
      persistedOrder.total = total;
      await orderRepository.save(persistedOrder);

      await manager.increment(Customer, { id: customer.id }, 'order_count', 1);
      await manager.update(
        Customer,
        { id: customer.id },
        { last_order_at: new Date() },
      );

      if (customer.order_count === 0) {
        isFirstOrder = true;
      }

      return persistedOrder;
    });

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
      relations: ['customer', 'items', 'items.replaced_by_product'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Order> {
    const order = await this.ordersRepository.findOne({
      where: { id },
      relations: ['customer', 'items', 'items.replaced_by_product', 'tenant'],
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

    Object.assign(order, updateOrderDto);

    if (updateOrderDto.total !== undefined) {
      order.pricing_mode = PricingMode.MANUAL;
    }

    const savedOrder = await this.ordersRepository.save(order);

    if (updateOrderDto.status && updateOrderDto.status !== previousStatus) {
      await this.notifyCustomerStatusChange(savedOrder);
    }

    return savedOrder;
  }

  /**
   * Sets or clears replacement product for a specific order item.
   */
  async replaceOrderItem(
    tenantId: number,
    itemId: number,
    replacedByProductId: number | null,
  ): Promise<OrderItem> {
    const orderItem = await this.orderItemsRepository.findOne({
      where: { id: itemId },
      relations: ['order'],
    });

    if (!orderItem || orderItem.order.tenant_id !== tenantId) {
      throw new NotFoundException(`Order item with ID ${itemId} not found`);
    }

    if (replacedByProductId === null) {
      orderItem.replaced_by_product_id = null;
      return this.orderItemsRepository.save(orderItem);
    }

    const replacement = await this.productsRepository.findOne({
      where: {
        id: replacedByProductId,
        tenant_id: tenantId,
        status: ProductStatus.ACTIVE,
      },
    });

    if (!replacement) {
      throw new NotFoundException(
        `Replacement product with ID ${replacedByProductId} not found`,
      );
    }

    orderItem.replaced_by_product_id = replacement.id;
    return this.orderItemsRepository.save(orderItem);
  }

  async findByPublicToken(token: string): Promise<Order> {
    const order = await this.ordersRepository.findOne({
      where: { public_token: token },
      relations: {
        customer: true,
        items: {
          replaced_by_product: true,
        },
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

  /**
   * Resolves total price from explicit total or a unit-price calculation.
   */
  private resolveItemTotal(
    quantityText: string,
    unitPrice?: number,
    totalPrice?: number,
  ): number | null {
    if (totalPrice !== undefined && totalPrice !== null) {
      return this.roundCurrency(Number(totalPrice));
    }

    if (unitPrice === undefined || unitPrice === null) {
      return null;
    }

    const numericQty = this.parseNumericQuantity(quantityText);
    if (numericQty === null) {
      return null;
    }

    return this.roundCurrency(Number(unitPrice) * numericQty);
  }

  /**
   * Parses numeric quantity from free-text input when possible.
   */
  private parseNumericQuantity(quantityText: string): number | null {
    const match = quantityText.trim().replace(',', '.').match(/\d+(\.\d+)?/);
    if (!match) {
      return null;
    }

    const parsed = Number(match[0]);
    if (Number.isNaN(parsed) || parsed <= 0) {
      return null;
    }

    return parsed;
  }

  /**
   * Rounds currency values to 2 decimal places.
   */
  private roundCurrency(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private async notifyOrderCreated(
    order: Order,
    isFirstOrder: boolean,
  ): Promise<void> {
    try {
      await this.orderWhatsappService.notifySellerNewOrder(order);

      const trackingUrl = this.buildTrackingUrl(order.public_token);
      await this.orderWhatsappService.notifyCustomerConfirmed(
        order,
        trackingUrl,
      );

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
