import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Tenant } from './entities/tenant.entity';
import { generateUniqueSlug } from '../common/utils/slug.utils';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private tenantsRepository: Repository<Tenant>,
  ) {}

  async create(storeName: string, phone: string, manager?: EntityManager): Promise<Tenant> {
    const repo = manager ? manager.getRepository(Tenant) : this.tenantsRepository;

    const slug = await generateUniqueSlug(storeName, async (slug) => {
      const existing = await this.tenantsRepository.findOne({ where: { slug } });
      return !!existing;
    });

    const tenant = repo.create({
      name: storeName,
      phone,
      slug,
    });

    return repo.save(tenant);
  }

  async findOneBySlug(slug: string): Promise<Tenant | null> {
    return this.tenantsRepository.findOne({ where: { slug } });
  }
}

