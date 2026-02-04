import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTenantCategoryEnum1769905000000 implements MigrationInterface {
    name = 'AddTenantCategoryEnum1769905000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."tenants_category_enum" AS ENUM('grocery', 'greengrocer', 'butcher', 'bakery', 'pharmacy', 'other')`);
        await queryRunner.query(`ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "category" character varying`);
        await queryRunner.query(`UPDATE "tenants" SET "category" = 'other' WHERE "category" IS NULL OR "category" NOT IN ('grocery', 'greengrocer', 'butcher', 'bakery', 'pharmacy', 'other')`);
        await queryRunner.query(`ALTER TABLE "tenants" ALTER COLUMN "category" TYPE "public"."tenants_category_enum" USING "category"::text::"public"."tenants_category_enum"`);
        await queryRunner.query(`ALTER TABLE "tenants" ALTER COLUMN "category" SET DEFAULT 'other'`);
        await queryRunner.query(`ALTER TABLE "tenants" ALTER COLUMN "category" SET NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tenants" ALTER COLUMN "category" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "tenants" ALTER COLUMN "category" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "tenants" ALTER COLUMN "category" TYPE character varying USING "category"::text`);
        await queryRunner.query(`DROP TYPE "public"."tenants_category_enum"`);
    }

}
