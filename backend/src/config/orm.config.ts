import { config } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';

const ENV = process.env.NODE_ENV;

config({ path: ENV ? `.env.${ENV}` : '.env' });

const dbConfig: DataSourceOptions = {
  type: 'postgres',
  url: process.env.DB_URL,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],
  migrationsRun: false,
  migrationsTableName: process.env.MIGRATIONS_TABLE_NAME,
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  ssl: false,
  extra: {
    ssl: false,
  },
};

const dataSource = new DataSource(dbConfig);
export default dataSource;
