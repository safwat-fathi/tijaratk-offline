import { config } from 'dotenv';
import { defineConfig } from 'prisma/config';

const ENV = process.env.NODE_ENV;
config({
  path: ENV ? `.env.${ENV}` : '.env',
});

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env.DB_URL,
  },
});
