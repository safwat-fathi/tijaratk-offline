import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCustomerStatsTriggers1769891593130 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create the function to update customer stats
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION update_customer_stats_on_order()
            RETURNS TRIGGER AS $$
            BEGIN
              UPDATE customers
              SET
                order_count = order_count + 1,
                last_order_at = NEW.created_at,
                first_order_at = COALESCE(first_order_at, NEW.created_at)
              WHERE id = NEW.customer_id;

              RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `);

        // Create the trigger
        await queryRunner.query(`
            CREATE TRIGGER trg_update_customer_stats
            AFTER INSERT ON orders
            FOR EACH ROW
            EXECUTE FUNCTION update_customer_stats_on_order();
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TRIGGER IF EXISTS trg_update_customer_stats ON orders`);
        await queryRunner.query(`DROP FUNCTION IF EXISTS update_customer_stats_on_order`);
    }

}
