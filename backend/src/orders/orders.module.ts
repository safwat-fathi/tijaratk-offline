import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CustomersModule } from 'src/customers/customers.module';
import { TenantsModule } from 'src/tenants/tenants.module';


@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem]),
    CustomersModule,
    TenantsModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
