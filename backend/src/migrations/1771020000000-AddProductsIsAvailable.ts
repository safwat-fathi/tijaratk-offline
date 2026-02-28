import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductsIsAvailable1771020000000 implements MigrationInterface {
  name = 'AddProductsIsAvailable1771020000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='is_available') THEN ALTER TABLE "products" ADD "is_available" boolean NOT NULL DEFAULT true; END IF; END $$;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN "is_available"`,
    );
  }
}
