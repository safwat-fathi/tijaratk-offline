import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductOrderModeAndOrderItemSelections1770932000000 implements MigrationInterface {
  name = 'AddProductOrderModeAndOrderItemSelections1770932000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DO $$ BEGIN CREATE TYPE "public"."products_order_mode_enum" AS ENUM('quantity', 'weight', 'price'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='order_mode') THEN ALTER TABLE "products" ADD "order_mode" "public"."products_order_mode_enum" NOT NULL DEFAULT 'quantity'; END IF; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='order_config') THEN ALTER TABLE "products" ADD "order_config" jsonb; END IF; END $$;`,
    );
    await queryRunner.query(`UPDATE "products" SET "order_config" = '{"quantity":{"unit_label":"قطعة"}}'::jsonb WHERE "order_config" IS NULL`);

    await queryRunner.query(
      `DO $$ BEGIN CREATE TYPE "public"."order_items_selection_mode_enum" AS ENUM('quantity', 'weight', 'price'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='order_items' AND column_name='selection_mode') THEN ALTER TABLE "order_items" ADD "selection_mode" "public"."order_items_selection_mode_enum"; END IF; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='order_items' AND column_name='selection_quantity') THEN ALTER TABLE "order_items" ADD "selection_quantity" numeric(10,3); END IF; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='order_items' AND column_name='selection_grams') THEN ALTER TABLE "order_items" ADD "selection_grams" integer; END IF; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='order_items' AND column_name='selection_amount_egp') THEN ALTER TABLE "order_items" ADD "selection_amount_egp" numeric(10,2); END IF; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='order_items' AND column_name='unit_option_id') THEN ALTER TABLE "order_items" ADD "unit_option_id" character varying(64); END IF; END $$;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "order_items" DROP COLUMN "unit_option_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" DROP COLUMN "selection_amount_egp"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" DROP COLUMN "selection_grams"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" DROP COLUMN "selection_quantity"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" DROP COLUMN "selection_mode"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."order_items_selection_mode_enum"`,
    );

    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN "order_config"`,
    );
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "order_mode"`);
    await queryRunner.query(`DROP TYPE "public"."products_order_mode_enum"`);
  }
}
