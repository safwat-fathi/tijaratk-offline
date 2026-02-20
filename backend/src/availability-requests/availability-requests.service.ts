import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DbTenantContext } from 'src/common/contexts/db-tenant.context';
import { Product } from 'src/products/entities/product.entity';
import { ProductStatus } from 'src/common/enums/product-status.enum';
import { AvailabilityRequest } from './entities/availability-request.entity';
import { CreateAvailabilityRequestDto } from './dto/create-availability-request.dto';

type CreateAvailabilityRequestResult = {
  status: 'created' | 'already_requested_today';
  requested_at: Date;
  product_id: number;
};

type AvailabilityTopProduct = {
  product_id: number;
  product_name: string;
  requests_count: number;
  last_requested_at: Date;
};

type MerchantAvailabilitySummary = {
  today_total_requests: number;
  top_products: AvailabilityTopProduct[];
};

@Injectable()
export class AvailabilityRequestsService {
  private static readonly CAIRO_TIME_ZONE = 'Africa/Cairo';

  constructor(
    @InjectRepository(AvailabilityRequest)
    private readonly availabilityRequestsRepository: Repository<AvailabilityRequest>,
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
  ) {}

  async createPublicBySlug(
    slug: string,
    dto: CreateAvailabilityRequestDto,
  ): Promise<CreateAvailabilityRequestResult> {
    const normalizedSlug = slug.trim();
    if (!normalizedSlug) {
      throw new BadRequestException('Tenant slug is required');
    }

    const visitorKey = this.normalizeVisitorKey(dto.visitor_key);
    const productId = dto.product_id;

    const product = await this.getProductsRepository()
      .createQueryBuilder('product')
      .innerJoin('product.tenant', 'tenant')
      .where('tenant.slug = :slug', { slug: normalizedSlug })
      .andWhere('product.id = :productId', { productId })
      .andWhere('product.status = :status', { status: ProductStatus.ACTIVE })
      .getOne();

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.is_available) {
      throw new BadRequestException('Product is currently available');
    }

    const requestDate = this.getCairoDateKey();

    const availabilityRequest = this.getAvailabilityRequestsRepository().create(
      {
        tenant_id: product.tenant_id,
        product_id: product.id,
        visitor_key: visitorKey,
        request_date: requestDate,
      },
    );

    try {
      const saved =
        await this.getAvailabilityRequestsRepository().save(
          availabilityRequest,
        );

      return {
        status: 'created',
        requested_at: saved.created_at,
        product_id: saved.product_id,
      };
    } catch (error) {
      if (!this.isUniqueViolation(error)) {
        throw error;
      }

      const existing = await this.getAvailabilityRequestsRepository().findOne({
        where: {
          tenant_id: product.tenant_id,
          product_id: product.id,
          visitor_key: visitorKey,
          request_date: requestDate,
        },
        order: {
          created_at: 'DESC',
        },
      });

      return {
        status: 'already_requested_today',
        requested_at: existing?.created_at ?? new Date(),
        product_id: product.id,
      };
    }
  }

  async getMerchantSummary(
    tenantId: number,
    days = 1,
    limit = 5,
  ): Promise<MerchantAvailabilitySummary> {
    const normalizedDays = this.normalizeDays(days);
    const normalizedLimit = this.normalizeLimit(limit);

    const todayDate = this.getCairoDateKey();
    const fromDate = this.shiftDateKey(todayDate, normalizedDays - 1);

    const totalRow = await this.getAvailabilityRequestsRepository()
      .createQueryBuilder('request')
      .select('COUNT(request.id)', 'total')
      .where('request.tenant_id = :tenantId', { tenantId })
      .andWhere('request.request_date = :todayDate', { todayDate })
      .getRawOne<{ total: string }>();

    const topRows = await this.getAvailabilityRequestsRepository()
      .createQueryBuilder('request')
      .innerJoin('request.product', 'product')
      .select('request.product_id', 'product_id')
      .addSelect('MAX(product.name)', 'product_name')
      .addSelect('COUNT(request.id)', 'requests_count')
      .addSelect('MAX(request.created_at)', 'last_requested_at')
      .where('request.tenant_id = :tenantId', { tenantId })
      .andWhere('request.request_date >= :fromDate', { fromDate })
      .andWhere('request.request_date <= :todayDate', { todayDate })
      .groupBy('request.product_id')
      .orderBy('requests_count', 'DESC')
      .addOrderBy('last_requested_at', 'DESC')
      .limit(normalizedLimit)
      .getRawMany<{
        product_id: string;
        product_name: string;
        requests_count: string;
        last_requested_at: Date;
      }>();

    return {
      today_total_requests: Number(totalRow?.total || 0),
      top_products: topRows.map((row) => ({
        product_id: Number(row.product_id),
        product_name: row.product_name,
        requests_count: Number(row.requests_count),
        last_requested_at: new Date(row.last_requested_at),
      })),
    };
  }

  private normalizeVisitorKey(visitorKey: string): string {
    const normalized = visitorKey.trim();
    if (!normalized) {
      throw new BadRequestException('visitor_key is required');
    }

    return normalized;
  }

  private normalizeDays(days: number): number {
    if (!Number.isFinite(days)) {
      return 1;
    }

    return Math.min(30, Math.max(1, Math.trunc(days)));
  }

  private normalizeLimit(limit: number): number {
    if (!Number.isFinite(limit)) {
      return 5;
    }

    return Math.min(20, Math.max(1, Math.trunc(limit)));
  }

  private shiftDateKey(dateKey: string, subtractDays: number): string {
    const [year, month, day] = dateKey.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    date.setUTCDate(date.getUTCDate() - Math.max(0, subtractDays));

    const nextYear = String(date.getUTCFullYear());
    const nextMonth = String(date.getUTCMonth() + 1).padStart(2, '0');
    const nextDay = String(date.getUTCDate()).padStart(2, '0');

    return `${nextYear}-${nextMonth}-${nextDay}`;
  }

  private getCairoDateKey(date = new Date()): string {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: AvailabilityRequestsService.CAIRO_TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date);

    const year = parts.find((part) => part.type === 'year')?.value;
    const month = parts.find((part) => part.type === 'month')?.value;
    const day = parts.find((part) => part.type === 'day')?.value;

    if (!year || !month || !day) {
      throw new Error('Failed to resolve Cairo date key');
    }

    return `${year}-${month}-${day}`;
  }

  private isUniqueViolation(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }

    const errorCode =
      'code' in error && typeof error.code === 'string' ? error.code : null;

    return errorCode === '23505';
  }

  private getAvailabilityRequestsRepository(): Repository<AvailabilityRequest> {
    const manager = DbTenantContext.getManager();

    return manager
      ? manager.getRepository(AvailabilityRequest)
      : this.availabilityRequestsRepository;
  }

  private getProductsRepository(): Repository<Product> {
    const manager = DbTenantContext.getManager();

    return manager ? manager.getRepository(Product) : this.productsRepository;
  }
}
