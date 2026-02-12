import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCustomerReplacementDecisionFlow1770904000000
  implements MigrationInterface
{
  name = 'AddCustomerReplacementDecisionFlow1770904000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."orders_status_enum" ADD VALUE IF NOT EXISTS 'rejected_by_customer'`,
    );

    await queryRunner.query(
      `CREATE TYPE "public"."order_items_replacement_decision_status_enum" AS ENUM('none', 'pending', 'approved', 'rejected')`,
    );

    await queryRunner.query(
      `ALTER TABLE "order_items" ADD "pending_replacement_product_id" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD "replacement_decision_status" "public"."order_items_replacement_decision_status_enum" NOT NULL DEFAULT 'none'`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD "replacement_decision_reason" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD "replacement_decided_at" TIMESTAMP WITH TIME ZONE`,
    );

    await queryRunner.query(
      `ALTER TABLE "order_items" ADD CONSTRAINT "FK_order_items_pending_replacement_product" FOREIGN KEY ("pending_replacement_product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_order_items_pending_replacement_product" ON "order_items" ("pending_replacement_product_id")`,
    );

    await queryRunner.query(
      `ALTER TABLE "orders" ADD "customer_rejection_reason" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD "customer_rejected_at" TIMESTAMP WITH TIME ZONE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "orders" DROP COLUMN "customer_rejected_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" DROP COLUMN "customer_rejection_reason"`,
    );

    await queryRunner.query(
      `DROP INDEX "public"."IDX_order_items_pending_replacement_product"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" DROP CONSTRAINT "FK_order_items_pending_replacement_product"`,
    );

    await queryRunner.query(
      `ALTER TABLE "order_items" DROP COLUMN "replacement_decided_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" DROP COLUMN "replacement_decision_reason"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" DROP COLUMN "replacement_decision_status"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" DROP COLUMN "pending_replacement_product_id"`,
    );

    await queryRunner.query(
      `DROP TYPE "public"."order_items_replacement_decision_status_enum"`,
    );

    await queryRunner.query(
      `ALTER TABLE "orders" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `UPDATE "orders" SET "status" = 'cancelled' WHERE "status" = 'rejected_by_customer'`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."orders_status_enum_old" AS ENUM('draft', 'confirmed', 'out_for_delivery', 'completed', 'cancelled')`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ALTER COLUMN "status" TYPE "public"."orders_status_enum_old" USING ("status"::text::"public"."orders_status_enum_old")`,
    );
    await queryRunner.query(`DROP TYPE "public"."orders_status_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."orders_status_enum_old" RENAME TO "orders_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'draft'`,
    );
  }
}
