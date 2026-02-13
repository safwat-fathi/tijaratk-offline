import { Column, Entity, Index, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { TenantBaseEntity } from 'src/common/entities/tenant-base.entity';

/**
 * Daily closure snapshot for a tenant.
 */
@Entity('day_closures')
@Unique('UQ_day_closures_tenant_date', ['tenant_id', 'closure_date'])
export class DayClosure extends TenantBaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'date' })
  closure_date: string;

  @Column({ type: 'int', default: 0 })
  orders_count: number;

  @Column({ type: 'int', default: 0 })
  cancelled_count: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  completed_sales_total: number;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  closed_at: Date;
}
