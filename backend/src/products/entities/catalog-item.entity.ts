import { BaseEntity } from 'src/common/entities/base.entity';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('catalog_items')
export class CatalogItem extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  image_url?: string;

  @Column()
  category: string;

  @Column({ default: true })
  is_active: boolean;
}
