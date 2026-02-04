import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';
import {
  TENANT_CATEGORIES,
  TENANT_CATEGORY_VALUES,
  TenantCategory,
} from '../constants/tenant-category';

enum TenantStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

@Entity('tenants')
export class Tenant extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  phone: string;

  @Column({ type: 'int', default: 0 })
  customer_counter: number;

  @Column({
    type: 'enum',
    enum: TENANT_CATEGORY_VALUES,
    default: TENANT_CATEGORIES.OTHER.value,
  })
  category: TenantCategory;

  @Column({ unique: true })
  slug: string;

  @Column({
    type: 'enum',
    enum: TenantStatus,
    default: TenantStatus.ACTIVE,
  })
  status: TenantStatus;
}
