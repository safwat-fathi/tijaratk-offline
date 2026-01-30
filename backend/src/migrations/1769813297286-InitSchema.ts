import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1769813297286 implements MigrationInterface {
    name = 'InitSchema1769813297286'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE INDEX "IDX_109638590074998bb72a2f2cf0" ON "users" ("tenant_id") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_109638590074998bb72a2f2cf0"`);
    }

}
