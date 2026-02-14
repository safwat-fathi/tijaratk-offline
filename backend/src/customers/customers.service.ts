import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { formatPhoneNumber } from 'src/common/utils/phone.util';
import { Order } from 'src/orders/entities/order.entity';
import { DbTenantContext } from 'src/common/contexts/db-tenant.context';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customersRepository: Repository<Customer>,
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
  ) {}

  async create(
    createCustomerDto: CreateCustomerDto,
    tenantId: number,
  ): Promise<Customer> {
    const customer = this.getCustomersRepository().create({
      ...createCustomerDto,
      tenant_id: tenantId,
    });
    return this.getCustomersRepository().save(customer);
  }

  async findAll(
    tenantId: number,
    search?: string,
    page = 1,
    limit = 20,
  ): Promise<{ data: Customer[]; meta: any }> {
    const query = this.getCustomersRepository()
      .createQueryBuilder('customer')
      .where('customer.tenant_id = :tenantId', { tenantId });

    if (search) {
      // Check if search is a number (for code search)
      const isNumeric = !isNaN(Number(search));

      if (isNumeric) {
        query.andWhere(
          '(customer.code = :code OR customer.phone ILIKE :search OR customer.name ILIKE :search OR customer.merchant_label ILIKE :search)',
          { code: Number(search), search: `%${search}%` },
        );
      } else {
        query.andWhere(
          '(customer.name ILIKE :search OR customer.phone ILIKE :search OR customer.merchant_label ILIKE :search)',
          { search: `%${search}%` },
        );
      }
    }

    query.orderBy('customer.last_order_at', 'DESC', 'NULLS LAST'); // Sort by recent activity

    // Pagination
    query.skip((page - 1) * limit).take(limit);

    const [data, total] = await query.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        last_page: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number, tenantId: number): Promise<any | null> {
    const customer = await this.getCustomersRepository().findOne({
      where: { id, tenant_id: tenantId },
    });
    if (!customer) return null;

    const [orders, totalOrders] = await this.getOrdersRepository().findAndCount({
      where: { customer_id: id },
      order: { created_at: 'DESC' },
      take: 5,
    });

    // Self-healing: Update stats if mismatched
    if (customer.order_count !== totalOrders) {
      customer.order_count = totalOrders;
      if (orders.length > 0) {
        customer.last_order_at = orders[0].created_at;
      }
      await this.getCustomersRepository().save(customer);
    }

    return { ...customer, orders };
  }

  async findOrCreate(
    rawPhone: string,
    tenantId: number,
    name?: string,
    address?: string,
    manager?: EntityManager,
  ): Promise<Customer> {
    const phone = formatPhoneNumber(rawPhone);
    const scopedManager = manager ?? DbTenantContext.getManager();
    const repo = scopedManager
      ? scopedManager.getRepository(Customer)
      : this.getCustomersRepository();

    let customer = await repo.findOne({
      where: { phone, tenant_id: tenantId },
    });

    if (!customer) {
      // New Customer Creation Logic
      if (!scopedManager) {
        // If no manager provided, we MUST start a transaction to ensure counter safety
        return this.getCustomersRepository().manager.transaction(
          async (txManager) => {
            await txManager.query(
              `SELECT set_config('app.tenant_id', $1, true)`,
              [String(tenantId)],
            );
            return this.createCustomerWithCode(
              txManager,
              phone,
              tenantId,
              name,
              address,
            );
          },
        );
      } else {
        // Already in a transaction
        return this.createCustomerWithCode(
          scopedManager,
          phone,
          tenantId,
          name,
          address,
        );
      }
    }

    // Update existing customer details if provided
    let hasUpdates = false;
    if (name && customer.name !== name) {
      customer.name = name;
      hasUpdates = true;
    }

    if (address && customer.address !== address) {
      customer.address = address;
      hasUpdates = true;
    }

    if (hasUpdates) {
      return repo.save(customer);
    }

    return customer;
  }

  private async createCustomerWithCode(
    manager: EntityManager,
    phone: string,
    tenantId: number,
    name?: string,
    address?: string,
  ): Promise<Customer> {
    // Lock the tenant row to prevent race conditions on counter
    // 'pessimistic_write' locks the row for update
    /* 
       Note: We need to access Tenant entity. Since we don't have Tenant repository injected,
       we use manager.getRepository('Tenant') or query builder.
       Assuming Tenant entity is available in typeorm context.
    */

    // Increment counter
    await manager.query(
      `UPDATE tenants SET customer_counter = customer_counter + 1 WHERE id = $1`,
      [tenantId],
    );

    // Fetch the new counter value
    const result = await manager.query(
      `SELECT customer_counter FROM tenants WHERE id = $1`,
      [tenantId],
    );
    const newCode = result[0].customer_counter;

    const customer = manager.create(Customer, {
      phone,
      tenant_id: tenantId,
      name,
      address,
      code: newCode,
    });

    return manager.save(customer);
  }

  async updateMerchantLabel(
    id: number,
    label: string,
    tenantId: number,
  ): Promise<Customer> {
    const customer = await this.findOne(id, tenantId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    await this.getCustomersRepository().update(id, { merchant_label: label });
    // Use findOne to return the updated entity, assuming standard findOne logic is fine
    // Or just use findOneBy if we just want the entity
    const updated = await this.getCustomersRepository().findOneBy({ id });
    if (!updated) {
      throw new Error('Customer not found after update');
    }
    return updated;
  }

  /**
   * Returns customers repository bound to request manager when present.
   */
  private getCustomersRepository(): Repository<Customer> {
    const manager = DbTenantContext.getManager();
    return manager ? manager.getRepository(Customer) : this.customersRepository;
  }

  /**
   * Returns orders repository bound to request manager when present.
   */
  private getOrdersRepository(): Repository<Order> {
    const manager = DbTenantContext.getManager();
    return manager ? manager.getRepository(Order) : this.ordersRepository;
  }
}
