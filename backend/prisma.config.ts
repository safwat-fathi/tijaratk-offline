import { config } from 'dotenv';
import { defineConfig } from 'prisma/config';
import { resolveDatabaseUrl } from './src/config/database-url.config';

const ENV = process.env.NODE_ENV;
config({
  path:
    process.env.DOTENV_CONFIG_PATH ||
    process.env.dotenv_config_path ||
    (ENV ? `.env.${ENV}` : '.env'),
});

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: resolveDatabaseUrl(),
  },
});
