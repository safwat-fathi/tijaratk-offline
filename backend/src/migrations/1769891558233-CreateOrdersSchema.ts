import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateOrdersSchema1769891558233 implements MigrationInterface {
    name = 'CreateOrdersSchema1769891558233'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "products" ("created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "tenant_id" integer NOT NULL, "id" SERIAL NOT NULL, "name" character varying NOT NULL, "price" numeric(10,2) NOT NULL, "sku" character varying, "description" text, "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_9c365ebf78f0e8a6d9e4827ea7" ON "products" ("tenant_id") `);
        await queryRunner.query(`CREATE TABLE "customers" ("created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "tenant_id" integer NOT NULL, "id" SERIAL NOT NULL, "phone" character varying NOT NULL, "name" character varying, "address" text, "notes" text, "first_order_at" TIMESTAMP, "last_order_at" TIMESTAMP, "order_count" integer NOT NULL DEFAULT '0', "completed_order_count" integer NOT NULL DEFAULT '0', CONSTRAINT "UQ_d9ef0802e47c0384f5831b59733" UNIQUE ("tenant_id", "phone"), CONSTRAINT "PK_133ec679a801fab5e070f73d3ea" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_97913f35ac2e435a4463fb50a0" ON "customers" ("tenant_id") `);
        await queryRunner.query(`CREATE TABLE "order_items" ("id" SERIAL NOT NULL, "order_id" integer NOT NULL, "product_id" integer, "title" character varying NOT NULL, "unit_price" numeric(10,2) NOT NULL, "quantity" integer NOT NULL, "total" numeric(10,2) NOT NULL, CONSTRAINT "PK_005269d8574e6fac0493715c308" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."orders_order_type_enum" AS ENUM('catalog', 'free_text')`);
        await queryRunner.query(`CREATE TYPE "public"."orders_status_enum" AS ENUM('draft', 'confirmed', 'out_for_delivery', 'completed', 'cancelled')`);
        await queryRunner.query(`CREATE TYPE "public"."orders_pricing_mode_enum" AS ENUM('auto', 'manual')`);
        await queryRunner.query(`CREATE TABLE "orders" ("created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "tenant_id" integer NOT NULL, "id" SERIAL NOT NULL, "customer_id" integer NOT NULL, "public_token" character varying NOT NULL, "order_type" "public"."orders_order_type_enum" NOT NULL, "status" "public"."orders_status_enum" NOT NULL DEFAULT 'draft', "pricing_mode" "public"."orders_pricing_mode_enum" NOT NULL DEFAULT 'auto', "subtotal" numeric(10,2), "delivery_fee" numeric(10,2) NOT NULL DEFAULT '0', "total" numeric(10,2), "free_text_payload" jsonb, "notes" text, CONSTRAINT "UQ_3bf085262cc6cb52991c77f90bb" UNIQUE ("public_token"), CONSTRAINT "PK_710e2d4957aa5878dfe94e4ac2f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_527dd6efd5f3402f729c6b3e82" ON "orders" ("tenant_id") `);
        await queryRunner.query(`ALTER TABLE "products" ADD CONSTRAINT "FK_9c365ebf78f0e8a6d9e4827ea70" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "customers" ADD CONSTRAINT "FK_97913f35ac2e435a4463fb50a01" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_items" ADD CONSTRAINT "FK_145532db85752b29c57d2b7b1f1" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_items" ADD CONSTRAINT "FK_9263386c35b6b242540f9493b00" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "FK_527dd6efd5f3402f729c6b3e826" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "FK_772d0ce0473ac2ccfa26060dbe9" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_772d0ce0473ac2ccfa26060dbe9"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_527dd6efd5f3402f729c6b3e826"`);
        await queryRunner.query(`ALTER TABLE "order_items" DROP CONSTRAINT "FK_9263386c35b6b242540f9493b00"`);
        await queryRunner.query(`ALTER TABLE "order_items" DROP CONSTRAINT "FK_145532db85752b29c57d2b7b1f1"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP CONSTRAINT "FK_97913f35ac2e435a4463fb50a01"`);
        await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "FK_9c365ebf78f0e8a6d9e4827ea70"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_527dd6efd5f3402f729c6b3e82"`);
        await queryRunner.query(`DROP TABLE "orders"`);
        await queryRunner.query(`DROP TYPE "public"."orders_pricing_mode_enum"`);
        await queryRunner.query(`DROP TYPE "public"."orders_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."orders_order_type_enum"`);
        await queryRunner.query(`DROP TABLE "order_items"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_97913f35ac2e435a4463fb50a0"`);
        await queryRunner.query(`DROP TABLE "customers"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9c365ebf78f0e8a6d9e4827ea7"`);
        await queryRunner.query(`DROP TABLE "products"`);
    }

}
