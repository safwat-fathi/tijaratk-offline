import {
	BeforeInsert,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { TenantBaseEntity } from 'src/common/entities/tenant-base.entity';
import { Customer } from 'src/customers/entities/customer.entity';
import { OrderItem } from './order-item.entity';
import { OrderType } from 'src/common/enums/order-type.enum';
import { OrderStatus } from 'src/common/enums/order-status.enum';
import { PricingMode } from 'src/common/enums/pricing-mode.enum';

@Entity('orders')
export class Order extends TenantBaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'customer_id' })
  customer_id: number;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer: Relation<Customer>;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: Relation<OrderItem[]>;

  @Column({ unique: true })
  public_token: string;

  @Column({
    type: 'enum',
    enum: OrderType,
  })
  order_type: OrderType;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.DRAFT,
  })
  status: OrderStatus;

  @Column({
    type: 'enum',
    enum: PricingMode,
    default: PricingMode.AUTO,
  })
  pricing_mode: PricingMode;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  subtotal?: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  delivery_fee?: number;

  @Column({ type: 'text', nullable: true })
  delivery_address?: string;

  @Column({ nullable: true })
  customer_phone?: string;

  @Column({ nullable: true })
  customer_name?: string;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  total?: number;

  @Column({ type: 'jsonb', nullable: true })
  free_text_payload?: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @BeforeInsert()
  generatePublicToken() {
    this.public_token = crypto.randomUUID();
  }
}
