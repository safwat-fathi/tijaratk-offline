import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { TenantBaseEntity } from 'src/common/entities/tenant-base.entity';

@Entity('customers')
@Unique(['tenant_id', 'phone'])
export class Customer extends TenantBaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  phone: string;

  @Column({ nullable: true })
  name?: string;

  @Column({ type: 'text', nullable: true })
  address?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  // Stats - Managed by DB Triggers
  @Column({ type: 'timestamp', nullable: true })
  first_order_at?: Date;

  @Column({ type: 'timestamp', nullable: true })
  last_order_at?: Date;

  @Column({ type: 'int', default: 0 })
  order_count: number;

  @Column({ type: 'int', default: 0 })
  completed_order_count: number;
}
