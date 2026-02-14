import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
  Unique,
} from 'typeorm';
import { TenantBaseEntity } from 'src/common/entities/tenant-base.entity';
import { Product } from 'src/products/entities/product.entity';

@Entity('availability_requests')
@Unique('UQ_availability_requests_tenant_product_visitor_date', [
  'tenant_id',
  'product_id',
  'visitor_key',
  'request_date',
])
export class AvailabilityRequest extends TenantBaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'int' })
  product_id: number;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Relation<Product>;

  @Index()
  @Column({ type: 'varchar', length: 64 })
  visitor_key: string;

  @Index()
  @Column({ type: 'date' })
  request_date: string;
}
