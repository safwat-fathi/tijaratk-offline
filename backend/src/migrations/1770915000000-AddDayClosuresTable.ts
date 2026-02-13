import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDayClosuresTable1770915000000 implements MigrationInterface {
  name = 'AddDayClosuresTable1770915000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "day_closures" (
        "id" SERIAL NOT NULL,
        "tenant_id" integer NOT NULL,
        "closure_date" date NOT NULL,
        "orders_count" integer NOT NULL DEFAULT 0,
        "cancelled_count" integer NOT NULL DEFAULT 0,
        "completed_sales_total" numeric(10,2) NOT NULL DEFAULT 0,
        "closed_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "PK_day_closures_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_day_closures_tenant_date" UNIQUE ("tenant_id", "closure_date"),
        CONSTRAINT "FK_day_closures_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_day_closures_tenant_id"
      ON "day_closures" ("tenant_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX IF EXISTS "public"."IDX_day_closures_tenant_id"',
    );
    await queryRunner.query('DROP TABLE IF EXISTS "day_closures"');
  }
}
