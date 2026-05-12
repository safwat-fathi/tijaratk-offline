import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { ImageProcessorService } from 'src/common/services/image-processor.service';

@Module({
  imports: [],
  controllers: [ProductsController],
  providers: [ProductsService, ImageProcessorService],
  exports: [ProductsService],
})
export class ProductsModule {}
