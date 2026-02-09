import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { TenantBaseEntity } from 'src/common/entities/tenant-base.entity';
import { ProductSource } from 'src/common/enums/product-source.enum';
import { ProductStatus } from 'src/common/enums/product-status.enum';

@Entity('products')
export class Product extends TenantBaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  image_url?: string;

  @Column({ type: 'varchar', length: 64, default: 'أخرى' })
  category: string;

  @Column({
    type: 'enum',
    enum: ProductSource,
    default: ProductSource.MANUAL,
  })
  source: ProductSource;

  @Column({
    type: 'enum',
    enum: ProductStatus,
    default: ProductStatus.ACTIVE,
  })
  status: ProductStatus;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  current_price?: number | null;
}
