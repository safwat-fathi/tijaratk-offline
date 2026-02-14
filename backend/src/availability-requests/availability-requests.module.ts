import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from 'src/products/entities/product.entity';
import { AvailabilityRequestsController } from './availability-requests.controller';
import { AvailabilityRequestsService } from './availability-requests.service';
import { AvailabilityRequest } from './entities/availability-request.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AvailabilityRequest, Product])],
  controllers: [AvailabilityRequestsController],
  providers: [AvailabilityRequestsService],
  exports: [AvailabilityRequestsService],
})
export class AvailabilityRequestsModule {}
