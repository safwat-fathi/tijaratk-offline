import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Tenant } from '../../generated/prisma/client';
import { TENANT_CATEGORIES, TenantCategory } from './constants/tenant-category';
import { generateUniqueSlug } from '../common/utils/slug.utils';

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    storeName: string,
    phone: string,
    category?: TenantCategory,
    manager?: Prisma.TransactionClient,
  ): Promise<Tenant> {
    const db = manager || this.prisma;

    const slug = await generateUniqueSlug(storeName, async (slug) => {
      const existing = await this.prisma.tenant.findUnique({
        where: { slug },
      });
      return !!existing;
    });

    return db.tenant.create({
      data: {
        name: storeName,
        phone,
        slug,
        category: category || TENANT_CATEGORIES.OTHER.value,
      },
    });
  }

  async findOneBySlug(slug: string): Promise<Tenant | null> {
    return this.prisma.tenant.findUnique({ where: { slug } });
  }

  async findOneById(id: number): Promise<Tenant | null> {
    return this.prisma.tenant.findUnique({ where: { id } });
  }
}
