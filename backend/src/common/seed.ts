import { Logger } from '@nestjs/common';
import dataSource from 'src/config/orm.config';
import { seedCatalog } from './seeders/catalog.seeder';
import { seedSupermarketMerchant } from './seeders/supermarket-merchant.seeder';

async function bootstrap() {
  const logger = new Logger('Seed');
  logger.log('Seeding...');

  await dataSource.initialize();

  try {
    await seedCatalog(dataSource);
    await seedSupermarketMerchant(dataSource);

    logger.log('Seeding completed successfully.');
  } catch (error) {
    logger.error('Seeding error:', error);
  } finally {
    await dataSource.destroy();
  }
}

void bootstrap();
