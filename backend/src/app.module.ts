import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import dataSource from './config/orm.config';
import { HealthController } from './health/health.controller';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { TenantsModule } from './tenants/tenants.module';
import { ProductsModule } from './products/products.module';
import { CustomersModule } from './customers/customers.module';
import { OrdersModule } from './orders/orders.module';
import { WebhooksModule } from './webhooks/webhooks.module';

const ENV = process.env.NODE_ENV;

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ENV ? `.env.${ENV}` : '.env',
    }),
    CacheModule.register({
      isGlobal: true,
      ttl: 3600, // Default TTL is 1 hour
    }),
    TypeOrmModule.forRoot({ ...dataSource.options, autoLoadEntities: true }),
    ThrottlerModule.forRoot([
      {
        ttl: 60, // 1 minute
        limit: 10, // 10 requests
      },
    ]),
    UsersModule,
    AuthModule,
    WhatsappModule,
    TenantsModule,
    ProductsModule,
    CustomersModule,
    OrdersModule,
    WebhooksModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
