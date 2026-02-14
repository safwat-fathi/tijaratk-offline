import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductOrderModeAndOrderItemSelections1770932000000 implements MigrationInterface {
  name = 'AddProductOrderModeAndOrderItemSelections1770932000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."products_order_mode_enum" AS ENUM('quantity', 'weight', 'price')`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD "order_mode" "public"."products_order_mode_enum" NOT NULL DEFAULT 'quantity'`,
    );
    await queryRunner.query(`ALTER TABLE "products" ADD "order_config" jsonb`);
    await queryRunner.query(
      `UPDATE "products" SET "order_config" = '{"quantity":{"unit_label":"قطعة"}}'::jsonb WHERE "order_config" IS NULL`,
    );

    await queryRunner.query(
      `CREATE TYPE "public"."order_items_selection_mode_enum" AS ENUM('quantity', 'weight', 'price')`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD "selection_mode" "public"."order_items_selection_mode_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD "selection_quantity" numeric(10,3)`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD "selection_grams" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD "selection_amount_egp" numeric(10,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD "unit_option_id" character varying(64)`,
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
