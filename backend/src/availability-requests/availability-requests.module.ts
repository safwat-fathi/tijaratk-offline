import { Module } from '@nestjs/common';
import { AvailabilityRequestsController } from './availability-requests.controller';
import { AvailabilityRequestsService } from './availability-requests.service';

@Module({
  imports: [],
  controllers: [AvailabilityRequestsController],
  providers: [AvailabilityRequestsService],
  exports: [AvailabilityRequestsService],
})
export class AvailabilityRequestsModule {}
