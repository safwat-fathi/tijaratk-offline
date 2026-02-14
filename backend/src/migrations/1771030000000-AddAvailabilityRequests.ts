import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAvailabilityRequests1771030000000
  implements MigrationInterface
{
  name = 'AddAvailabilityRequests1771030000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "availability_requests" (
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        "tenant_id" integer NOT NULL,
        "id" SERIAL NOT NULL,
        "product_id" integer NOT NULL,
        "visitor_key" character varying(64) NOT NULL,
        "request_date" date NOT NULL,
        CONSTRAINT "UQ_availability_requests_tenant_product_visitor_date"
          UNIQUE ("tenant_id", "product_id", "visitor_key", "request_date"),
        CONSTRAINT "PK_availability_requests_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "availability_requests"
      ADD CONSTRAINT "FK_availability_requests_tenant"
      FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "availability_requests"
      ADD CONSTRAINT "FK_availability_requests_product"
      FOREIGN KEY ("product_id") REFERENCES "products"("id")
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_availability_requests_tenant_created_at" ON "availability_requests" ("tenant_id", "created_at" DESC)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_availability_requests_tenant_product_request_date" ON "availability_requests" ("tenant_id", "product_id", "request_date")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_availability_requests_product_id" ON "availability_requests" ("product_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_availability_requests_visitor_key" ON "availability_requests" ("visitor_key")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_availability_requests_request_date" ON "availability_requests" ("request_date")`,
    );

    await queryRunner.query(
      `ALTER TABLE "availability_requests" ENABLE ROW LEVEL SECURITY`,
    );
    await queryRunner.query(
      `ALTER TABLE "availability_requests" FORCE ROW LEVEL SECURITY`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS "tenant_isolation_availability_requests" ON "availability_requests"`,
    );
    await queryRunner.query(`
      CREATE POLICY "tenant_isolation_availability_requests"
      ON "availability_requests"
      USING (tenant_id = app.current_tenant_id())
      WITH CHECK (tenant_id = app.current_tenant_id())
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP POLICY IF EXISTS "tenant_isolation_availability_requests" ON "availability_requests"`,
    );
    await queryRunner.query(
      `ALTER TABLE "availability_requests" NO FORCE ROW LEVEL SECURITY`,
    );
    await queryRunner.query(
      `ALTER TABLE "availability_requests" DISABLE ROW LEVEL SECURITY`,
    );

    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_availability_requests_request_date"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_availability_requests_visitor_key"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_availability_requests_product_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_availability_requests_tenant_product_request_date"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_availability_requests_tenant_created_at"`,
    );

    await queryRunner.query(
      `ALTER TABLE "availability_requests" DROP CONSTRAINT "FK_availability_requests_product"`,
    );
    await queryRunner.query(
      `ALTER TABLE "availability_requests" DROP CONSTRAINT "FK_availability_requests_tenant"`,
    );
    await queryRunner.query(`DROP TABLE "availability_requests"`);
  }
}
