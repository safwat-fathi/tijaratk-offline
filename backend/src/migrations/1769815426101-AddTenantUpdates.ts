import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTenantUpdates1769815426101 implements MigrationInterface {
    name = 'AddTenantUpdates1769815426101'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tenants" ADD "phone" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "tenants" ADD CONSTRAINT "UQ_23d5a62128e1a248126c8453ff0" UNIQUE ("phone")`);
        await queryRunner.query(`CREATE TYPE "public"."tenants_status_enum" AS ENUM('active', 'inactive', 'suspended')`);
        await queryRunner.query(`ALTER TABLE "tenants" ADD "status" "public"."tenants_status_enum" NOT NULL DEFAULT 'active'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "public"."tenants_status_enum"`);
        await queryRunner.query(`ALTER TABLE "tenants" DROP CONSTRAINT "UQ_23d5a62128e1a248126c8453ff0"`);
        await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "phone"`);
    }

}
