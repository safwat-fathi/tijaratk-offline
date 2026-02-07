import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { Product } from './entities/product.entity';
import { CatalogItem } from './entities/catalog-item.entity';
import { ImageProcessorService } from 'src/common/services/image-processor.service';

@Module({
  imports: [TypeOrmModule.forFeature([Product, CatalogItem])],
  controllers: [ProductsController],
  providers: [ProductsService, ImageProcessorService],
  exports: [ProductsService],
})
export class ProductsModule {}
