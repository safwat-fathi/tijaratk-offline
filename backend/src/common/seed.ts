import { Logger } from '@nestjs/common';
import { seedCatalog } from './seeders/catalog.seeder';
import { seedSupermarketMerchant } from './seeders/supermarket-merchant.seeder';
import { PrismaClient } from '../../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

async function bootstrap() {
  const logger = new Logger('Seed');
  logger.log('Seeding...');

  const dbUrl =
    process.env.DATABASE_URL ||
    `postgresql://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}?schema=public`;

  const pool = new Pool({ connectionString: dbUrl });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  await prisma.$connect();

  try {
    await seedCatalog(prisma);
    await seedSupermarketMerchant(prisma);

    logger.log('Seeding completed successfully.');
  } catch (error) {
    logger.error('Seeding error:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

void bootstrap();
