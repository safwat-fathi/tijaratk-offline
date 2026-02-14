import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { Order } from './order.entity';
import { Product } from 'src/products/entities/product.entity';
import { ReplacementDecisionStatus } from 'src/common/enums/replacement-decision-status.enum';
import { OrderItemSelectionMode } from 'src/common/enums/order-item-selection-mode.enum';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  order_id: number;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Relation<Order>;

  @Column({ nullable: true })
  product_id?: number | null;

  @ManyToOne(() => Product, { nullable: true })
  @JoinColumn({ name: 'product_id' })
  product?: Relation<Product>;

  @Column()
  name_snapshot: string;

  @Column({ type: 'text' })
  quantity: string;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  unit_price?: number | null;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  total_price?: number | null;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({
    type: 'enum',
    enum: OrderItemSelectionMode,
    nullable: true,
  })
  selection_mode?: OrderItemSelectionMode | null;

  @Column('decimal', { precision: 10, scale: 3, nullable: true })
  selection_quantity?: number | null;

  @Column({ type: 'int', nullable: true })
  selection_grams?: number | null;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  selection_amount_egp?: number | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  unit_option_id?: string | null;

  @Column({ nullable: true })
  replaced_by_product_id?: number | null;

  @ManyToOne(() => Product, { nullable: true })
  @JoinColumn({ name: 'replaced_by_product_id' })
  replaced_by_product?: Relation<Product>;

  @Column({ nullable: true })
  pending_replacement_product_id?: number | null;

  @ManyToOne(() => Product, { nullable: true })
  @JoinColumn({ name: 'pending_replacement_product_id' })
  pending_replacement_product?: Relation<Product>;

  @Column({
    type: 'enum',
    enum: ReplacementDecisionStatus,
    default: ReplacementDecisionStatus.NONE,
  })
  replacement_decision_status: ReplacementDecisionStatus;

  @Column({ type: 'text', nullable: true })
  replacement_decision_reason?: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  replacement_decided_at?: Date | null;
}
