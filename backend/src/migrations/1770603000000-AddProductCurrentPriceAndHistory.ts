import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductCurrentPriceAndHistory1770603000000 implements MigrationInterface {
  name = 'AddProductCurrentPriceAndHistory1770603000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='current_price') THEN ALTER TABLE "products" ADD "current_price" numeric(10,2); END IF; END $$;`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "product_price_history" (
        "id" SERIAL NOT NULL,
        "tenant_id" integer NOT NULL,
        "product_id" integer NOT NULL,
        "price" numeric(10,2) NOT NULL,
        "effective_from" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "effective_to" TIMESTAMP WITH TIME ZONE,
        "reason" text,
        CONSTRAINT "PK_product_price_history_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_product_price_history_tenant_product_effective_from"
      ON "product_price_history" ("tenant_id", "product_id", "effective_from")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_product_price_history_active"
      ON "product_price_history" ("tenant_id", "product_id")
      WHERE "effective_to" IS NULL
    `);

    await queryRunner.query(`
      DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_product_price_history_tenant') THEN
      ALTER TABLE "product_price_history"
      ADD CONSTRAINT "FK_product_price_history_tenant"
      FOREIGN KEY ("tenant_id")
      REFERENCES "tenants"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION; END IF; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_product_price_history_product') THEN
      ALTER TABLE "product_price_history"
      ADD CONSTRAINT "FK_product_price_history_product"
      FOREIGN KEY ("product_id")
      REFERENCES "products"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION; END IF; END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "product_price_history"
      DROP CONSTRAINT "FK_product_price_history_product"
    `);
    await queryRunner.query(`
      ALTER TABLE "product_price_history"
      DROP CONSTRAINT "FK_product_price_history_tenant"
    `);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_product_price_history_active"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_product_price_history_tenant_product_effective_from"`,
    );
    await queryRunner.query(`DROP TABLE "product_price_history"`);
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN "current_price"`,
    );
  }
}
