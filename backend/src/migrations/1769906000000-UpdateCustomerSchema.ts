import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateCustomerSchema1769906000000 implements MigrationInterface {
    name = 'UpdateCustomerSchema1769906000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Add customer_counter to tenants
        await queryRunner.query(`ALTER TABLE "tenants" ADD "customer_counter" integer NOT NULL DEFAULT '0'`);

        // 2. Add merchant_label to customers
        await queryRunner.query(`ALTER TABLE "customers" ADD "merchant_label" character varying`);

        // 3. Add code to customers (nullable initially for data migration)
        await queryRunner.query(`ALTER TABLE "customers" ADD "code" integer`);

        // 4. Migrate existing data: Assign sequential codes to existing customers per tenant
        // Using a CTE to calculate the sequence
        await queryRunner.query(`
            WITH seq AS (
                SELECT id, ROW_NUMBER() OVER (PARTITION BY tenant_id ORDER BY created_at) as new_code
                FROM "customers"
            )
            UPDATE "customers"
            SET "code" = seq.new_code
            FROM seq
            WHERE "customers"."id" = seq.id
        `);

        // 5. Update tenant counters based on the max code assigned
        // Coalesce to 0 if no customers exist
        await queryRunner.query(`
            UPDATE "tenants" t
            SET "customer_counter" = COALESCE((SELECT MAX("code") FROM "customers" c WHERE c."tenant_id" = t.id), 0)
        `);

        // 6. Make code NOT NULL
        // Handle case where code might still be null (shouldn't happen with the update above, unless no customers)
        // If table was empty, code is null? No, new rows need value.
        // If table has rows, code is updated.
        // We set default 0 just in case, or we rely on logic.
        // But for constraint we want it NOT NULL.
        // Alter column to NOT NULL. default 0 is risky if unique constraint exists.
        // Let's just set NOT NULL.
        await queryRunner.query(`ALTER TABLE "customers" ALTER COLUMN "code" SET NOT NULL`);

        // 7. Add Unique Constraint
        await queryRunner.query(`ALTER TABLE "customers" ADD CONSTRAINT "UQ_tenant_customer_code" UNIQUE ("tenant_id", "code")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customers" DROP CONSTRAINT "UQ_tenant_customer_code"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "code"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "merchant_label"`);
        await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "customer_counter"`);
    }

}
