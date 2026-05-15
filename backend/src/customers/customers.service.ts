import { Injectable } from '@nestjs/common';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { formatPhoneNumber } from '@/common/utils/phone.util';
import { DbTenantContext } from '@/common/contexts/db-tenant.context';
import { PrismaService } from '@/prisma/prisma.service';
import { Customer, Order, Prisma } from '../../generated/prisma/client';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createCustomerDto: CreateCustomerDto,
    tenantId: number,
  ): Promise<Customer> {
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.tenant_id', ${String(tenantId)}, true)`;
      return this.createCustomerWithCode(
        tx,
        createCustomerDto.phone,
        tenantId,
        createCustomerDto.name,
        createCustomerDto.address,
        createCustomerDto.notes,
      );
    });
  }

  async findAll(
    tenantId: number,
    search?: string,
    page = 1,
    limit = 20,
  ): Promise<{ data: Customer[]; meta: any }> {
    const where: Prisma.CustomerWhereInput = { tenant_id: tenantId };

    if (search) {
      const isNumeric = !isNaN(Number(search));

      if (isNumeric) {
        where.OR = [
          { code: Number(search) },
          { phone: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } },
          { merchant_label: { contains: search, mode: 'insensitive' } },
        ];
      } else {
        where.OR = [
          { phone: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } },
          { merchant_label: { contains: search, mode: 'insensitive' } },
        ];
      }
    }

    const [data, total] = await this.prisma.$transaction([
      this.getCustomersDb().findMany({
        where,
        orderBy: { last_order_at: { sort: 'desc', nulls: 'last' } },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.getCustomersDb().count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        last_page: Math.ceil(total / limit),
      },
    };
  }

  async findOne(
    id: number,
    tenantId: number,
  ): Promise<(Customer & { orders?: Order[] }) | null> {
    const customer = await this.getCustomersDb().findFirst({
      where: { id, tenant_id: tenantId },
    });
    if (!customer) return null;

    const [orders, totalOrders] = await this.prisma.$transaction([
      this.getOrdersDb().findMany({
        where: { customer_id: id },
        orderBy: { created_at: 'desc' },
        take: 5,
      }),
      this.getOrdersDb().count({
        where: { customer_id: id },
      }),
    ]);

    // Self-healing: Update stats if mismatched
    if (customer.order_count !== totalOrders) {
      customer.order_count = totalOrders;
      if (orders.length > 0) {
        customer.last_order_at = orders[0].created_at;
      }
      await this.getCustomersDb().update({
        where: { id: customer.id },
        data: {
          order_count: customer.order_count,
          last_order_at: customer.last_order_at,
        },
      });
    }

    return { ...customer, orders };
  }

  async findOrCreate(
    rawPhone: string,
    tenantId: number,
    name?: string,
    address?: string,
    manager?: Prisma.TransactionClient,
  ): Promise<Customer> {
    const phone = formatPhoneNumber(rawPhone);
    const scopedManager = manager ?? DbTenantContext.getManager();
    const db = scopedManager ? scopedManager.customer : this.getCustomersDb();

    const customer = await db.findFirst({
      where: { phone, tenant_id: tenantId },
    });

    if (!customer) {
      // New Customer Creation Logic
      if (!scopedManager) {
        // If no manager provided, we MUST start a transaction to ensure counter safety
        return this.prisma.$transaction(
          async (tx) => {
            await tx.$executeRaw`SELECT set_config('app.tenant_id', ${String(tenantId)}, true)`;
            return this.createCustomerWithCode(
              tx,
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
    const updateData: any = {};
    if (name && customer.name !== name) {
      updateData.name = name;
      hasUpdates = true;
    }

    if (address && customer.address !== address) {
      updateData.address = address;
      hasUpdates = true;
    }

    if (hasUpdates) {
      return db.update({
        where: { id: customer.id },
        data: updateData,
      });
    }

    return customer;
  }

  private async createCustomerWithCode(
    manager: Prisma.TransactionClient,
    phone: string,
    tenantId: number,
    name?: string,
    address?: string,
    notes?: string,
  ): Promise<Customer> {
    // Increment counter
    await manager.$executeRaw`UPDATE tenants SET customer_counter = customer_counter + 1 WHERE id = ${tenantId}`;

    // Fetch the new counter value
    const result = await manager.$queryRaw<Array<{ customer_counter: number }>>`SELECT customer_counter FROM tenants WHERE id = ${tenantId}`;
    const newCode = Number(result[0].customer_counter);

    return manager.customer.create({
      data: {
        phone,
        tenant_id: tenantId,
        name,
        address,
        notes,
        code: newCode,
      },
    });
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

    await this.getCustomersDb().update({
      where: { id },
      data: { merchant_label: label },
    });
    
    const updated = await this.getCustomersDb().findUnique({ where: { id } });
    if (!updated) {
      throw new Error('Customer not found after update');
    }
    return updated;
  }

  private getCustomersDb() {
    const manager = DbTenantContext.getManager();
    return manager ? manager.customer : this.prisma.customer;
  }

  private getOrdersDb() {
    const manager = DbTenantContext.getManager();
    return manager ? manager.order : this.prisma.order;
  }
}
