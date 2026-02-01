import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { CustomersService } from 'src/customers/customers.service';
import { PricingMode } from 'src/common/enums/pricing-mode.enum';
import { OrderStatus } from 'src/common/enums/order-status.enum';
import { TenantsService } from 'src/tenants/tenants.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemsRepository: Repository<OrderItem>,
    private readonly customersService: CustomersService,
    private readonly tenantsService: TenantsService,
    private readonly dataSource: DataSource,
  ) {}

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    return this.dataSource.transaction(async (manager) => {
      let tenantId = createOrderDto.tenant_id;
      if (!tenantId && createOrderDto.tenant_slug) {
        const tenant = await this.tenantsService.findOneBySlug(createOrderDto.tenant_slug);
        if (tenant) {
            tenantId = tenant.id;
        } else {
             throw new NotFoundException(`Tenant with slug ${createOrderDto.tenant_slug} not found`);
        }
      }

      if (!tenantId) {
          throw new Error('Tenant ID or Slug is required');
      }

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
           subtotal = createOrderDto.items.reduce((sum, item) => sum + (Number(item.unit_price) * Number(item.quantity)), 0);
        }
      } else {
        // Auto calculation
        if (hasItems && createOrderDto.items) {
          subtotal = createOrderDto.items.reduce((sum, item) => sum + (Number(item.unit_price) * Number(item.quantity)), 0);
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

      return savedOrder;
    });
  }

  async findAll(tenantId: number): Promise<Order[]> {
    return this.ordersRepository.find({
      where: { tenant_id: tenantId },
      relations: ['customer', 'items'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Order> {
    const order = await this.ordersRepository.findOne({
      where: { id },
      relations: ['customer', 'items'],
    });
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
    return order;
  }

  async update(id: number, updateOrderDto: UpdateOrderDto): Promise<Order> {
    const order = await this.findOne(id);
    
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

    return this.ordersRepository.save(order);
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
        },
      },
    });
    if (!order) {
      throw new NotFoundException(`Order with token ${token} not found`);
    }
    return order;
  }
}
