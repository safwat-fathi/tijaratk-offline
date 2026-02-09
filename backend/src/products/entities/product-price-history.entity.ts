import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('product_price_history')
export class ProductPriceHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tenant_id: number;

  @Column()
  product_id: number;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  effective_from: Date;

  @Column({ type: 'timestamptz', nullable: true })
  effective_to?: Date | null;

  @Column({ type: 'text', nullable: true })
  reason?: string | null;
}
