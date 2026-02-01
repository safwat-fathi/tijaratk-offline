import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTenantSlug1769817007237 implements MigrationInterface {
    name = 'AddTenantSlug1769817007237'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tenants" ADD "slug" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "tenants" ADD CONSTRAINT "UQ_2310ecc5cb8be427097154b18fc" UNIQUE ("slug")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tenants" DROP CONSTRAINT "UQ_2310ecc5cb8be427097154b18fc"`);
        await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "slug"`);
    }

}
