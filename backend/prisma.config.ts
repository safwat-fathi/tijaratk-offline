import { config } from 'dotenv';
import { defineConfig } from 'prisma/config';

const ENV = process.env.NODE_ENV;
config({ path: ENV ? `.env.${ENV}` : '.env' });

const dbUrl =
  process.env.DATABASE_URL ||
  `postgresql://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}?schema=public`;

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: dbUrl,
  },
});
