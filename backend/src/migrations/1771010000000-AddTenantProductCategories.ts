import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTenantProductCategories1771010000000 implements MigrationInterface {
  name = 'AddTenantProductCategories1771010000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "tenant_product_categories" (
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        "tenant_id" integer NOT NULL,
        "id" SERIAL NOT NULL,
        "name" character varying(64) NOT NULL,
        CONSTRAINT "PK_tenant_product_categories_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_tenant_product_categories_tenant_id"
          FOREIGN KEY ("tenant_id")
          REFERENCES "tenants"("id")
          ON DELETE CASCADE
          ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_tenant_product_categories_tenant_id" ON "tenant_product_categories" ("tenant_id")`,
    );

    await queryRunner.query(`
      DELETE FROM "tenant_product_categories" a USING "tenant_product_categories" b
      WHERE a.id > b.id AND a.tenant_id = b.tenant_id AND a.name = b.name
    `);

    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_tenant_product_categories_tenant_id_name" ON "tenant_product_categories" ("tenant_id", "name")`,
    );

    await queryRunner.query(`
      INSERT INTO "tenant_product_categories" ("tenant_id", "name")
      SELECT DISTINCT
        product."tenant_id",
        LEFT(TRIM(product."category"), 64)
      FROM "products" AS product
      WHERE product."status" = 'active'
        AND product."category" IS NOT NULL
        AND TRIM(product."category") <> ''
      ON CONFLICT ("tenant_id", "name") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."UQ_tenant_product_categories_tenant_id_name"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_tenant_product_categories_tenant_id"`,
    );
    await queryRunner.query(`DROP TABLE "tenant_product_categories"`);
  }
}
