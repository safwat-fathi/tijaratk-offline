import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOrdersPublicTokenDefault1770582000000 implements MigrationInterface {
    name = 'AddOrdersPublicTokenDefault1770582000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "public_token" SET DEFAULT (gen_random_uuid())::text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "public_token" DROP DEFAULT`);
    }

}
