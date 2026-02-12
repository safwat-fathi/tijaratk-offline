import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  DataSource,
  DeepPartial,
  In,
  IsNull,
  Repository,
} from 'typeorm';
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
import { ProductPriceHistory } from 'src/products/entities/product-price-history.entity';
import { ReplacementDecisionStatus } from 'src/common/enums/replacement-decision-status.enum';
import { ReplacementDecisionAction } from './dto/decide-replacement.dto';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);
  private static readonly MAX_TRACKING_TOKENS = 15;

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
          const resolvedUnitPrice = this.resolveItemUnitPrice(
            item.unit_price,
            matchedProduct?.current_price,
          );
          const lineTotal = this.resolveItemTotal(
            quantityText,
            resolvedUnitPrice ?? undefined,
            item.total_price,
          );

          return {
            order_id: persistedOrder.id,
            product_id: matchedProduct?.id,
            name_snapshot:
              item.name?.trim() || matchedProduct?.name || 'منتج غير محدد',
            quantity: quantityText,
            unit_price: resolvedUnitPrice,
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
      relations: [
        'customer',
        'items',
        'items.replaced_by_product',
        'items.pending_replacement_product',
      ],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Order> {
    const order = await this.ordersRepository.findOne({
      where: { id },
      relations: [
        'customer',
        'items',
        'items.replaced_by_product',
        'items.pending_replacement_product',
        'tenant',
      ],
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
   * Sets or clears pending replacement product for a specific order item.
   */
  async replaceOrderItem(
    tenantId: number,
    itemId: number,
    replacementProductId: number | null,
  ): Promise<OrderItem> {
    const orderItem = await this.orderItemsRepository.findOne({
      where: { id: itemId },
      relations: ['order'],
    });

    if (!orderItem || orderItem.order.tenant_id !== tenantId) {
      throw new NotFoundException(`Order item with ID ${itemId} not found`);
    }

    this.ensureCustomerDecisionWindow(orderItem.order.status);

    if (
      orderItem.replacement_decision_status === ReplacementDecisionStatus.APPROVED ||
      orderItem.replacement_decision_status === ReplacementDecisionStatus.REJECTED
    ) {
      throw new BadRequestException(
        'Replacement decision is locked. Reset replacement decision before changing it.',
      );
    }

    if (replacementProductId === null) {
      orderItem.pending_replacement_product_id = null;
      orderItem.replaced_by_product_id = null;
      orderItem.replacement_decision_status = ReplacementDecisionStatus.NONE;
      orderItem.replacement_decision_reason = null;
      orderItem.replacement_decided_at = null;

      return this.orderItemsRepository.save(orderItem);
    }

    const replacement = await this.productsRepository.findOne({
      where: {
        id: replacementProductId,
        tenant_id: tenantId,
        status: ProductStatus.ACTIVE,
      },
    });

    if (!replacement) {
      throw new NotFoundException(
        `Replacement product with ID ${replacementProductId} not found`,
      );
    }

    orderItem.pending_replacement_product_id = replacement.id;
    orderItem.replaced_by_product_id = null;
    orderItem.replacement_decision_status = ReplacementDecisionStatus.PENDING;
    orderItem.replacement_decision_reason = null;
    orderItem.replacement_decided_at = null;

    const savedItem = await this.orderItemsRepository.save(orderItem);

    await this.notifyCustomerReplacementRequested(savedItem.order_id, savedItem.id);

    return savedItem;
  }

  /**
   * Clears replacement decision state so merchant can request another customer decision.
   */
  async resetOrderItemReplacement(
    tenantId: number,
    itemId: number,
  ): Promise<OrderItem> {
    const orderItem = await this.orderItemsRepository.findOne({
      where: { id: itemId },
      relations: ['order'],
    });

    if (!orderItem || orderItem.order.tenant_id !== tenantId) {
      throw new NotFoundException(`Order item with ID ${itemId} not found`);
    }

    this.ensureCustomerDecisionWindow(orderItem.order.status);

    orderItem.pending_replacement_product_id = null;
    orderItem.replaced_by_product_id = null;
    orderItem.replacement_decision_status = ReplacementDecisionStatus.NONE;
    orderItem.replacement_decision_reason = null;
    orderItem.replacement_decided_at = null;

    return this.orderItemsRepository.save(orderItem);
  }

  /**
   * Applies customer approval/rejection decision on a pending item replacement.
   */
  async decideReplacementByPublicToken(
    token: string,
    itemId: number,
    decision: ReplacementDecisionAction,
    reason?: string,
  ): Promise<OrderItem> {
    const orderItem = await this.orderItemsRepository.findOne({
      where: {
        id: itemId,
        order: {
          public_token: token,
        },
      },
      relations: ['order'],
    });

    if (!orderItem) {
      throw new NotFoundException(
        `Order item with ID ${itemId} for token ${token} not found`,
      );
    }

    this.ensureCustomerDecisionWindow(orderItem.order.status);

    if (
      orderItem.replacement_decision_status !== ReplacementDecisionStatus.PENDING ||
      !orderItem.pending_replacement_product_id
    ) {
      throw new BadRequestException(
        'No pending replacement available for customer decision',
      );
    }

    const normalizedReason = this.normalizeOptionalReason(reason);

    if (decision === ReplacementDecisionAction.APPROVE) {
      orderItem.replaced_by_product_id = orderItem.pending_replacement_product_id;
      orderItem.pending_replacement_product_id = null;
      orderItem.replacement_decision_status = ReplacementDecisionStatus.APPROVED;
    } else if (decision === ReplacementDecisionAction.REJECT) {
      orderItem.replaced_by_product_id = null;
      orderItem.pending_replacement_product_id = null;
      orderItem.replacement_decision_status = ReplacementDecisionStatus.REJECTED;
    } else {
      throw new BadRequestException('Invalid replacement decision');
    }

    orderItem.replacement_decision_reason = normalizedReason;
    orderItem.replacement_decided_at = new Date();

    const savedItem = await this.orderItemsRepository.save(orderItem);

    await this.notifyMerchantReplacementDecision(
      savedItem.order_id,
      savedItem.id,
      decision,
      normalizedReason,
    );

    return savedItem;
  }

  /**
   * Sets order as rejected by customer through public tracking token.
   */
  async rejectOrderByPublicToken(token: string, reason?: string): Promise<Order> {
    const order = await this.ordersRepository.findOne({
      where: { public_token: token },
    });

    if (!order) {
      throw new NotFoundException(`Order with token ${token} not found`);
    }

    this.ensureCustomerDecisionWindow(order.status);

    order.status = OrderStatus.REJECTED_BY_CUSTOMER;
    order.customer_rejection_reason = this.normalizeOptionalReason(reason);
    order.customer_rejected_at = new Date();

    return this.ordersRepository.save(order);
  }

  /**
   * Sets manual line price for an order item and recalculates order totals.
   */
  async updateOrderItemPrice(
    tenantId: number,
    itemId: number,
    totalPrice: number,
  ): Promise<OrderItem> {
    const normalizedTotal = this.roundCurrency(Number(totalPrice));
    if (Number.isNaN(normalizedTotal) || normalizedTotal <= 0) {
      throw new BadRequestException('Item price must be a positive number');
    }

    return this.dataSource.transaction(async (manager) => {
      const orderItemRepository = manager.getRepository(OrderItem);
      const orderRepository = manager.getRepository(Order);
      const productsRepository = manager.getRepository(Product);
      const priceHistoryRepository = manager.getRepository(ProductPriceHistory);

      const orderItem = await orderItemRepository.findOne({
        where: { id: itemId },
        relations: ['order'],
      });

      if (!orderItem || orderItem.order.tenant_id !== tenantId) {
        throw new NotFoundException(`Order item with ID ${itemId} not found`);
      }

      if (
        orderItem.order.status !== OrderStatus.DRAFT &&
        orderItem.order.status !== OrderStatus.CONFIRMED
      ) {
        throw new BadRequestException(
          'Item prices can only be updated for draft or confirmed orders',
        );
      }

      const numericQty = this.parseNumericQuantity(orderItem.quantity);
      const normalizedUnitPrice =
        numericQty !== null && numericQty > 0
          ? this.roundCurrency(normalizedTotal / numericQty)
          : normalizedTotal;

      orderItem.total_price = normalizedTotal;
      orderItem.unit_price = normalizedUnitPrice;
      const savedItem = await orderItemRepository.save(orderItem);

      const order = await orderRepository.findOne({
        where: { id: orderItem.order_id },
      });
      if (!order) {
        throw new NotFoundException(
          `Order with ID ${orderItem.order_id} not found`,
        );
      }

      const orderItems = await orderItemRepository.find({
        where: { order_id: order.id },
        select: ['total_price'],
      });

      const pricedLines = orderItems
        .map((item) => (item.total_price !== null ? Number(item.total_price) : null))
        .filter((value): value is number => value !== null && !Number.isNaN(value));

      const subtotal =
        pricedLines.length > 0
          ? this.roundCurrency(pricedLines.reduce((sum, value) => sum + value, 0))
          : undefined;

      const deliveryFee = Number(order.delivery_fee || 0);
      const recomputedTotal =
        subtotal !== undefined
          ? this.roundCurrency(subtotal + deliveryFee)
          : deliveryFee > 0
            ? this.roundCurrency(deliveryFee)
            : undefined;

      order.pricing_mode = PricingMode.MANUAL;
      order.subtotal = subtotal;
      order.total = recomputedTotal;
      await orderRepository.save(order);

      const targetProductId =
        orderItem.replaced_by_product_id ?? orderItem.product_id ?? null;
      if (targetProductId) {
        const targetProduct = await productsRepository.findOne({
          where: {
            id: targetProductId,
            tenant_id: tenantId,
          },
        });

        if (!targetProduct) {
          throw new NotFoundException(
            `Product with ID ${targetProductId} not found`,
          );
        }

        const activeHistory = await priceHistoryRepository.findOne({
          where: {
            tenant_id: tenantId,
            product_id: targetProduct.id,
            effective_to: IsNull(),
          },
          order: {
            effective_from: 'DESC',
            id: 'DESC',
          },
        });

        const activeHistoryPrice =
          activeHistory?.price !== undefined && activeHistory?.price !== null
            ? this.roundCurrency(Number(activeHistory.price))
            : null;

        if (
          activeHistory &&
          activeHistoryPrice !== null &&
          activeHistoryPrice === normalizedUnitPrice
        ) {
          targetProduct.current_price = normalizedUnitPrice;
          await productsRepository.save(targetProduct);
          return savedItem;
        }

        const now = new Date();

        if (activeHistory) {
          activeHistory.effective_to = now;
          await priceHistoryRepository.save(activeHistory);
        }

        await priceHistoryRepository.save(
          priceHistoryRepository.create({
            tenant_id: tenantId,
            product_id: targetProduct.id,
            price: normalizedUnitPrice,
            effective_from: now,
            reason: 'manual update from order item',
          }),
        );

        targetProduct.current_price = normalizedUnitPrice;
        await productsRepository.save(targetProduct);
      }

      return savedItem;
    });
  }

  async findByPublicToken(token: string): Promise<Order> {
    const order = await this.ordersRepository.findOne({
      where: { public_token: token },
      relations: this.publicTrackingRelations,
      select: this.publicTrackingSelect,
    });

    if (!order) {
      throw new NotFoundException(`Order with token ${token} not found`);
    }

    return order;
  }

  async findByPublicTokens(tokens: string[]): Promise<Order[]> {
    const normalizedTokens = this.normalizeTrackingTokens(tokens);
    if (normalizedTokens.length === 0) {
      return [];
    }

    const orders = await this.ordersRepository.find({
      where: { public_token: In(normalizedTokens) },
      relations: this.publicTrackingRelations,
      select: this.publicTrackingSelect,
    });

    const ordersByToken = new Map(
      orders.map((order) => [order.public_token, order]),
    );

    return normalizedTokens
      .map((token) => ordersByToken.get(token))
      .filter((order): order is Order => Boolean(order));
  }

  private normalizeTrackingTokens(tokens: string[]): string[] {
    if (!Array.isArray(tokens) || tokens.length === 0) {
      return [];
    }

    const normalized = tokens
      .map((token) => (typeof token === 'string' ? token.trim() : ''))
      .filter((token) => token.length > 0);

    return Array.from(new Set(normalized)).slice(
      0,
      OrdersService.MAX_TRACKING_TOKENS,
    );
  }

  private readonly publicTrackingRelations = {
    customer: true,
    items: {
      replaced_by_product: true,
      pending_replacement_product: true,
    },
    tenant: true,
  } as const;

  private readonly publicTrackingSelect = {
    tenant: {
      id: true,
      name: true,
      slug: true,
    },
  } as const;

  private validateStatusTransition(
    current: OrderStatus,
    next: OrderStatus,
  ): void {
    if (current === next) {
      return;
    }

    const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.DRAFT]: [
        OrderStatus.CONFIRMED,
        OrderStatus.CANCELLED,
        OrderStatus.REJECTED_BY_CUSTOMER,
      ],
      [OrderStatus.CONFIRMED]: [
        OrderStatus.OUT_FOR_DELIVERY,
        OrderStatus.CANCELLED,
        OrderStatus.REJECTED_BY_CUSTOMER,
      ],
      [OrderStatus.OUT_FOR_DELIVERY]: [
        OrderStatus.COMPLETED,
        OrderStatus.CANCELLED,
      ],
      [OrderStatus.COMPLETED]: [],
      [OrderStatus.CANCELLED]: [],
      [OrderStatus.REJECTED_BY_CUSTOMER]: [],
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
   * Resolves effective unit price for snapshot storage, preferring explicit item value.
   */
  private resolveItemUnitPrice(
    explicitUnitPrice?: number,
    productCurrentPrice?: number | null,
  ): number | null {
    if (explicitUnitPrice !== undefined && explicitUnitPrice !== null) {
      return this.roundCurrency(Number(explicitUnitPrice));
    }

    if (productCurrentPrice !== undefined && productCurrentPrice !== null) {
      const parsed = Number(productCurrentPrice);
      if (!Number.isNaN(parsed)) {
        return this.roundCurrency(parsed);
      }
    }

    return null;
  }

  /**
   * Rounds currency values to 2 decimal places.
   */
  private roundCurrency(value: number): number {
    return Math.round(value * 100) / 100;
  }

  /**
   * Ensures replacement decisions are only accepted while the order is still editable.
   */
  private ensureCustomerDecisionWindow(status: OrderStatus): void {
    if (status === OrderStatus.DRAFT || status === OrderStatus.CONFIRMED) {
      return;
    }

    throw new BadRequestException(
      'Customer replacement decision is allowed only for draft or confirmed orders',
    );
  }

  /**
   * Converts optional free-text reason to nullable clean value.
   */
  private normalizeOptionalReason(reason?: string): string | null {
    if (typeof reason !== 'string') {
      return null;
    }

    const trimmed = reason.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  /**
   * Sends customer notification after merchant requests replacement decision.
   */
  private async notifyCustomerReplacementRequested(
    orderId: number,
    itemId: number,
  ): Promise<void> {
    try {
      const order = await this.findOne(orderId);
      const item = order.items.find((line) => line.id === itemId);
      if (!item || !item.pending_replacement_product) {
        return;
      }

      await this.orderWhatsappService.notifyCustomerReplacementRequested(order, item);
    } catch (error) {
      this.logger.warn(
        `Failed to notify customer for replacement request on order ${orderId}, item ${itemId}`,
        error,
      );
    }
  }

  /**
   * Sends merchant notification after customer accepts or rejects replacement.
   */
  private async notifyMerchantReplacementDecision(
    orderId: number,
    itemId: number,
    decision: ReplacementDecisionAction,
    reason?: string | null,
  ): Promise<void> {
    try {
      const order = await this.findOne(orderId);
      const item = order.items.find((line) => line.id === itemId);
      if (!item) {
        return;
      }

      if (decision === ReplacementDecisionAction.APPROVE) {
        await this.orderWhatsappService.notifyMerchantReplacementAccepted(
          order,
          item,
        );
        return;
      }

      await this.orderWhatsappService.notifyMerchantReplacementRejected(
        order,
        item,
        reason || undefined,
      );
    } catch (error) {
      this.logger.warn(
        `Failed to notify merchant for replacement decision on order ${orderId}, item ${itemId}`,
        error,
      );
    }
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
      if (order.status === OrderStatus.DRAFT) return;
      await this.orderWhatsappService.notifyCustomerStatusUpdate(order);
    } catch (error) {
      this.logger.warn(
        `Failed to notify customer for order ${order.id} status ${order.status}`,
        error,
      );
    }
  }

  private buildTrackingUrl(publicToken: string): string {
    const baseUrl = process.env.APP_URL || 'http://localhost:3000';
    const normalizedBaseUrl = baseUrl.replace(/\/$/, '');
    return `${normalizedBaseUrl}/track-order/${publicToken}`;
  }
}
