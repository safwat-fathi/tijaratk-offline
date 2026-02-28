import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCustomerReplacementDecisionFlow1770904000000 implements MigrationInterface {
  name = 'AddCustomerReplacementDecisionFlow1770904000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."orders_status_enum" ADD VALUE IF NOT EXISTS 'rejected_by_customer'`,
    );

    await queryRunner.query(
      `DO $$ BEGIN CREATE TYPE "public"."order_items_replacement_decision_status_enum" AS ENUM('none', 'pending', 'approved', 'rejected'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
    );

    await queryRunner.query(
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='order_items' AND column_name='pending_replacement_product_id') THEN ALTER TABLE "order_items" ADD "pending_replacement_product_id" integer; END IF; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='order_items' AND column_name='replacement_decision_status') THEN ALTER TABLE "order_items" ADD "replacement_decision_status" "public"."order_items_replacement_decision_status_enum" NOT NULL DEFAULT 'none'; END IF; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='order_items' AND column_name='replacement_decision_reason') THEN ALTER TABLE "order_items" ADD "replacement_decision_reason" text; END IF; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='order_items' AND column_name='replacement_decided_at') THEN ALTER TABLE "order_items" ADD "replacement_decided_at" TIMESTAMP WITH TIME ZONE; END IF; END $$;`,
    );

    await queryRunner.query(
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_order_items_pending_replacement_product') THEN ALTER TABLE "order_items" ADD CONSTRAINT "FK_order_items_pending_replacement_product" FOREIGN KEY ("pending_replacement_product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION; END IF; END $$;`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_order_items_pending_replacement_product" ON "order_items" ("pending_replacement_product_id")`,
    );

    await queryRunner.query(
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='customer_rejection_reason') THEN ALTER TABLE "orders" ADD "customer_rejection_reason" text; END IF; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='customer_rejected_at') THEN ALTER TABLE "orders" ADD "customer_rejected_at" TIMESTAMP WITH TIME ZONE; END IF; END $$;`,
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
