import { Column, Index, JoinColumn, ManyToOne, Relation } from 'typeorm';
import { Tenant } from 'src/tenants/entities/tenant.entity';
import { BaseEntity } from './base.entity';

export abstract class TenantBaseEntity extends BaseEntity {
  @Index()
  @Column({ type: 'int', nullable: false })
  tenant_id: number;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Relation<Tenant>;
}
