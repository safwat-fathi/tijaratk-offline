import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTenantRlsPolicies1770925000000 implements MigrationInterface {
  name = 'AddTenantRlsPolicies1770925000000';

  /**
   * Creates tenant context functions and enables strict RLS policies.
   */
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS app`);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION app.current_tenant_id()
      RETURNS integer
      LANGUAGE plpgsql
      STABLE
      AS $$
      DECLARE
        tenant_value text;
      BEGIN
        tenant_value := current_setting('app.tenant_id', true);

        IF tenant_value IS NULL OR tenant_value = '' THEN
          RAISE EXCEPTION 'app.tenant_id is not set';
        END IF;

        RETURN tenant_value::integer;
      END;
      $$
    `);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION app.resolve_tenant_id_by_slug(p_slug text)
      RETURNS integer
      LANGUAGE sql
      STABLE
      AS $$
        SELECT t.id
        FROM tenants t
        WHERE t.slug = p_slug
          AND t.deleted_at IS NULL
        LIMIT 1
      $$
    `);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION app.resolve_tenant_id_by_order_token(p_token text)
      RETURNS integer
      LANGUAGE plpgsql
      VOLATILE
      AS $$
      DECLARE
        v_tenant_id integer;
      BEGIN
        PERFORM set_config('app.lookup_order_token', p_token, true);

        SELECT o.tenant_id
        INTO v_tenant_id
        FROM orders o
        WHERE o.public_token = p_token
          AND o.deleted_at IS NULL
        LIMIT 1;

        RETURN v_tenant_id;
      END;
      $$
    `);

    await queryRunner.query(
      `ALTER TABLE "products" ENABLE ROW LEVEL SECURITY`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" FORCE ROW LEVEL SECURITY`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS "tenant_isolation_products" ON "products"`,
    );
    await queryRunner.query(`
      CREATE POLICY "tenant_isolation_products"
      ON "products"
      USING (tenant_id = app.current_tenant_id())
      WITH CHECK (tenant_id = app.current_tenant_id())
    `);

    await queryRunner.query(
      `ALTER TABLE "customers" ENABLE ROW LEVEL SECURITY`,
    );
    await queryRunner.query(
      `ALTER TABLE "customers" FORCE ROW LEVEL SECURITY`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS "tenant_isolation_customers" ON "customers"`,
    );
    await queryRunner.query(`
      CREATE POLICY "tenant_isolation_customers"
      ON "customers"
      USING (tenant_id = app.current_tenant_id())
      WITH CHECK (tenant_id = app.current_tenant_id())
    `);

    await queryRunner.query(`ALTER TABLE "orders" ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE "orders" FORCE ROW LEVEL SECURITY`);
    await queryRunner.query(
      `DROP POLICY IF EXISTS "tenant_isolation_orders" ON "orders"`,
    );
    await queryRunner.query(`
      CREATE POLICY "tenant_isolation_orders"
      ON "orders"
      USING (tenant_id = app.current_tenant_id())
      WITH CHECK (tenant_id = app.current_tenant_id())
    `);
    await queryRunner.query(
      `DROP POLICY IF EXISTS "tracking_token_lookup_orders" ON "orders"`,
    );
    await queryRunner.query(`
      CREATE POLICY "tracking_token_lookup_orders"
      ON "orders"
      FOR SELECT
      USING (
        current_setting('app.lookup_order_token', true) IS NOT NULL
        AND public_token = current_setting('app.lookup_order_token', true)
      )
    `);

    await queryRunner.query(
      `ALTER TABLE "product_price_history" ENABLE ROW LEVEL SECURITY`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_price_history" FORCE ROW LEVEL SECURITY`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS "tenant_isolation_product_price_history" ON "product_price_history"`,
    );
    await queryRunner.query(`
      CREATE POLICY "tenant_isolation_product_price_history"
      ON "product_price_history"
      USING (tenant_id = app.current_tenant_id())
      WITH CHECK (tenant_id = app.current_tenant_id())
    `);

    await queryRunner.query(
      `ALTER TABLE "day_closures" ENABLE ROW LEVEL SECURITY`,
    );
    await queryRunner.query(
      `ALTER TABLE "day_closures" FORCE ROW LEVEL SECURITY`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS "tenant_isolation_day_closures" ON "day_closures"`,
    );
    await queryRunner.query(`
      CREATE POLICY "tenant_isolation_day_closures"
      ON "day_closures"
      USING (tenant_id = app.current_tenant_id())
      WITH CHECK (tenant_id = app.current_tenant_id())
    `);
  }

  /**
   * Drops tenant context functions and RLS policies from rollout scope tables.
   */
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP POLICY IF EXISTS "tenant_isolation_day_closures" ON "day_closures"`,
    );
    await queryRunner.query(
      `ALTER TABLE "day_closures" NO FORCE ROW LEVEL SECURITY`,
    );
    await queryRunner.query(`ALTER TABLE "day_closures" DISABLE ROW LEVEL SECURITY`);

    await queryRunner.query(
      `DROP POLICY IF EXISTS "tenant_isolation_product_price_history" ON "product_price_history"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_price_history" NO FORCE ROW LEVEL SECURITY`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_price_history" DISABLE ROW LEVEL SECURITY`,
    );

    await queryRunner.query(
      `DROP POLICY IF EXISTS "tracking_token_lookup_orders" ON "orders"`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS "tenant_isolation_orders" ON "orders"`,
    );
    await queryRunner.query(`ALTER TABLE "orders" NO FORCE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE "orders" DISABLE ROW LEVEL SECURITY`);

    await queryRunner.query(
      `DROP POLICY IF EXISTS "tenant_isolation_customers" ON "customers"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customers" NO FORCE ROW LEVEL SECURITY`,
    );
    await queryRunner.query(`ALTER TABLE "customers" DISABLE ROW LEVEL SECURITY`);

    await queryRunner.query(
      `DROP POLICY IF EXISTS "tenant_isolation_products" ON "products"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" NO FORCE ROW LEVEL SECURITY`,
    );
    await queryRunner.query(`ALTER TABLE "products" DISABLE ROW LEVEL SECURITY`);

    await queryRunner.query(
      `DROP FUNCTION IF EXISTS app.resolve_tenant_id_by_order_token(text)`,
    );
    await queryRunner.query(
      `DROP FUNCTION IF EXISTS app.resolve_tenant_id_by_slug(text)`,
    );
    await queryRunner.query(`DROP FUNCTION IF EXISTS app.current_tenant_id()`);
  }
}
