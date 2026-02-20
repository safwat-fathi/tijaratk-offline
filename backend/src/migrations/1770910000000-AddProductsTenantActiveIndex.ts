import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductsTenantActiveIndex1770910000000 implements MigrationInterface {
  name = 'AddProductsTenantActiveIndex1770910000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_products_tenant_active"
      ON "products" ("tenant_id")
      WHERE "status" = 'active'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX IF EXISTS "public"."IDX_products_tenant_active"',
    );
  }
}
