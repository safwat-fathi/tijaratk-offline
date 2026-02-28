import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductsCategory1770600000000 implements MigrationInterface {
  name = 'AddProductsCategory1770600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='category') THEN ALTER TABLE "products" ADD "category" character varying(64) NOT NULL DEFAULT 'أخرى'; END IF; END $$;`,
    );

    await queryRunner.query(`
      UPDATE "products" AS p
      SET "category" = c."category"
      FROM "catalog_items" AS c
      WHERE p."source" = 'catalog'
        AND p."name" = c."name"
        AND (
          (p."image_url" IS NULL AND c."image_url" IS NULL)
          OR p."image_url" = c."image_url"
        )
    `);

    await queryRunner.query(`
      WITH unique_catalog_names AS (
        SELECT
          "name",
          MIN("category") AS "category"
        FROM "catalog_items"
        GROUP BY "name"
        HAVING COUNT(DISTINCT "category") = 1
      )
      UPDATE "products" AS p
      SET "category" = u."category"
      FROM unique_catalog_names AS u
      WHERE p."source" = 'catalog'
        AND p."category" = 'أخرى'
        AND p."name" = u."name"
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_products_tenant_status_category_created_at" ON "products" ("tenant_id", "status", "category", "created_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_products_tenant_status_category_created_at"`,
    );
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "category"`);
  }
}
