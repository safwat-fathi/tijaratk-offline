import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductsIsAvailable1771020000000 implements MigrationInterface {
  name = 'AddProductsIsAvailable1771020000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products" ADD "is_available" boolean NOT NULL DEFAULT true`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN "is_available"`,
    );
  }
}
