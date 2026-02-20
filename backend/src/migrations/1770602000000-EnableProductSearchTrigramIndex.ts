import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnableProductSearchTrigramIndex1770602000000 implements MigrationInterface {
  name = 'EnableProductSearchTrigramIndex1770602000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS pg_trgm');

    await queryRunner.query(`
      CREATE INDEX "IDX_products_name_trgm_active"
      ON "products"
      USING GIN (LOWER("name") gin_trgm_ops)
      WHERE "status" = 'active'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX IF EXISTS "public"."IDX_products_name_trgm_active"',
    );
  }
}
