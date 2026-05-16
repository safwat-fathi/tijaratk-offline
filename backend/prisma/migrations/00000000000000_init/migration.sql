-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "app";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateEnum
CREATE TYPE "order_items_replacement_decision_status_enum" AS ENUM ('none', 'pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "order_items_selection_mode_enum" AS ENUM ('quantity', 'weight', 'price');

-- CreateEnum
CREATE TYPE "orders_order_type_enum" AS ENUM ('catalog', 'free_text');

-- CreateEnum
CREATE TYPE "orders_pricing_mode_enum" AS ENUM ('auto', 'manual');

-- CreateEnum
CREATE TYPE "orders_status_enum" AS ENUM ('draft', 'confirmed', 'out_for_delivery', 'completed', 'cancelled', 'rejected_by_customer');

-- CreateEnum
CREATE TYPE "products_order_mode_enum" AS ENUM ('quantity', 'weight', 'price');

-- CreateEnum
CREATE TYPE "products_source_enum" AS ENUM ('manual', 'catalog', 'order_note');

-- CreateEnum
CREATE TYPE "products_status_enum" AS ENUM ('active', 'archived');

-- CreateEnum
CREATE TYPE "tenants_category_enum" AS ENUM ('grocery', 'greengrocer', 'butcher', 'bakery', 'pharmacy', 'other');

-- CreateEnum
CREATE TYPE "tenants_status_enum" AS ENUM ('active', 'inactive', 'suspended');

-- CreateEnum
CREATE TYPE "users_role_enum" AS ENUM ('owner', 'staff');

-- CreateTable
CREATE TABLE "availability_requests" (
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(6),
    "tenant_id" INTEGER NOT NULL,
    "id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "visitor_key" VARCHAR(64) NOT NULL,
    "request_date" DATE NOT NULL,

    CONSTRAINT "PK_availability_requests_id" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog_items" (
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(6),
    "id" SERIAL NOT NULL,
    "name" VARCHAR NOT NULL,
    "image_url" TEXT,
    "category" VARCHAR NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "PK_dd1c29828c10a599d894b9b6535" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(6),
    "tenant_id" INTEGER NOT NULL,
    "id" SERIAL NOT NULL,
    "phone" VARCHAR NOT NULL,
    "name" VARCHAR,
    "code" INTEGER NOT NULL,
    "merchant_label" VARCHAR,
    "address" TEXT,
    "notes" TEXT,
    "first_order_at" TIMESTAMP(6),
    "last_order_at" TIMESTAMP(6),
    "order_count" INTEGER NOT NULL DEFAULT 0,
    "completed_order_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PK_133ec679a801fab5e070f73d3ea" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "day_closures" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "closure_date" DATE NOT NULL,
    "orders_count" INTEGER NOT NULL DEFAULT 0,
    "cancelled_count" INTEGER NOT NULL DEFAULT 0,
    "completed_sales_total" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "closed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "PK_day_closures_id" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "product_id" INTEGER,
    "name_snapshot" VARCHAR NOT NULL,
    "quantity" TEXT NOT NULL,
    "unit_price" DECIMAL(10,2),
    "total_price" DECIMAL(10,2),
    "notes" TEXT,
    "replaced_by_product_id" INTEGER,
    "pending_replacement_product_id" INTEGER,
    "replacement_decision_status" "order_items_replacement_decision_status_enum" NOT NULL DEFAULT 'none',
    "replacement_decision_reason" TEXT,
    "replacement_decided_at" TIMESTAMPTZ(6),
    "selection_mode" "order_items_selection_mode_enum",
    "selection_quantity" DECIMAL(10,3),
    "selection_grams" INTEGER,
    "selection_amount_egp" DECIMAL(10,2),
    "unit_option_id" VARCHAR(64),

    CONSTRAINT "PK_005269d8574e6fac0493715c308" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(6),
    "tenant_id" INTEGER NOT NULL,
    "id" SERIAL NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "public_token" VARCHAR NOT NULL DEFAULT (gen_random_uuid())::text,
    "order_type" "orders_order_type_enum" NOT NULL,
    "status" "orders_status_enum" NOT NULL DEFAULT 'draft',
    "pricing_mode" "orders_pricing_mode_enum" NOT NULL DEFAULT 'auto',
    "subtotal" DECIMAL(10,2),
    "delivery_fee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "delivery_address" TEXT,
    "customer_phone" VARCHAR,
    "customer_name" VARCHAR,
    "total" DECIMAL(10,2),
    "free_text_payload" JSONB,
    "notes" TEXT,
    "customer_rejection_reason" TEXT,
    "customer_rejected_at" TIMESTAMPTZ(6),

    CONSTRAINT "PK_710e2d4957aa5878dfe94e4ac2f" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_price_history" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "effective_from" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effective_to" TIMESTAMPTZ(6),
    "reason" TEXT,

    CONSTRAINT "PK_product_price_history_id" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(6),
    "tenant_id" INTEGER NOT NULL,
    "id" SERIAL NOT NULL,
    "name" VARCHAR NOT NULL,
    "image_url" TEXT,
    "source" "products_source_enum" NOT NULL DEFAULT 'manual',
    "status" "products_status_enum" NOT NULL DEFAULT 'active',
    "category" VARCHAR(64) NOT NULL DEFAULT 'أخرى',
    "current_price" DECIMAL(10,2),
    "order_mode" "products_order_mode_enum" NOT NULL DEFAULT 'quantity',
    "order_config" JSONB,
    "is_available" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_product_categories" (
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(6),
    "tenant_id" INTEGER NOT NULL,
    "id" SERIAL NOT NULL,
    "name" VARCHAR(64) NOT NULL,

    CONSTRAINT "PK_tenant_product_categories_id" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenants" (
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(6),
    "id" SERIAL NOT NULL,
    "name" VARCHAR NOT NULL,
    "phone" VARCHAR NOT NULL,
    "customer_counter" INTEGER NOT NULL DEFAULT 0,
    "category" "tenants_category_enum" NOT NULL DEFAULT 'other',
    "slug" VARCHAR NOT NULL,
    "status" "tenants_status_enum" NOT NULL DEFAULT 'active',

    CONSTRAINT "PK_53be67a04681c66b87ee27c9321" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(6),
    "tenant_id" INTEGER NOT NULL,
    "id" SERIAL NOT NULL,
    "phone" VARCHAR NOT NULL,
    "name" VARCHAR NOT NULL,
    "role" "users_role_enum" NOT NULL,
    "password" VARCHAR NOT NULL,

    CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IDX_availability_requests_product_id" ON "availability_requests"("product_id");

-- CreateIndex
CREATE INDEX "IDX_availability_requests_request_date" ON "availability_requests"("request_date");

-- CreateIndex
CREATE INDEX "IDX_availability_requests_tenant_created_at" ON "availability_requests"("tenant_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "IDX_availability_requests_tenant_product_request_date" ON "availability_requests"("tenant_id", "product_id", "request_date");

-- CreateIndex
CREATE INDEX "IDX_availability_requests_visitor_key" ON "availability_requests"("visitor_key");

-- CreateIndex
CREATE UNIQUE INDEX "UQ_availability_requests_tenant_product_visitor_date" ON "availability_requests"("tenant_id", "product_id", "visitor_key", "request_date");

-- CreateIndex
CREATE INDEX "IDX_97913f35ac2e435a4463fb50a0" ON "customers"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "UQ_31e385cc0f0f40cc6a0149b9806" ON "customers"("tenant_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "UQ_d9ef0802e47c0384f5831b59733" ON "customers"("tenant_id", "phone");

-- CreateIndex
CREATE INDEX "IDX_day_closures_tenant_id" ON "day_closures"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "UQ_day_closures_tenant_date" ON "day_closures"("tenant_id", "closure_date");

-- CreateIndex
CREATE INDEX "IDX_order_items_pending_replacement_product" ON "order_items"("pending_replacement_product_id");

-- CreateIndex
CREATE UNIQUE INDEX "UQ_3bf085262cc6cb52991c77f90bb" ON "orders"("public_token");

-- CreateIndex
CREATE INDEX "IDX_527dd6efd5f3402f729c6b3e82" ON "orders"("tenant_id");

-- CreateIndex
CREATE INDEX "IDX_product_price_history_active" ON "product_price_history"("tenant_id", "product_id") WHERE (effective_to IS NULL);

-- CreateIndex
CREATE INDEX "IDX_product_price_history_tenant_product_effective_from" ON "product_price_history"("tenant_id", "product_id", "effective_from");

-- CreateIndex
CREATE INDEX "IDX_9c365ebf78f0e8a6d9e4827ea7" ON "products"("tenant_id");

-- CreateIndex
CREATE INDEX "IDX_products_tenant_active" ON "products"("tenant_id") WHERE (status = 'active'::products_status_enum);

-- CreateIndex
CREATE INDEX "IDX_products_name_trgm_active" ON "products" USING GIN (LOWER("name") gin_trgm_ops) WHERE "status" = 'active';

-- CreateIndex
CREATE INDEX "IDX_products_tenant_status_category_created_at" ON "products"("tenant_id", "status", "category", "created_at");

-- CreateIndex
CREATE INDEX "IDX_tenant_product_categories_tenant_id" ON "tenant_product_categories"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "UQ_tenant_product_categories_tenant_id_name" ON "tenant_product_categories"("tenant_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "UQ_23d5a62128e1a248126c8453ff0" ON "tenants"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "UQ_2310ecc5cb8be427097154b18fc" ON "tenants"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "UQ_a000cca60bcf04454e727699490" ON "users"("phone");

-- CreateIndex
CREATE INDEX "IDX_109638590074998bb72a2f2cf0" ON "users"("tenant_id");

-- AddForeignKey
ALTER TABLE "availability_requests" ADD CONSTRAINT "FK_availability_requests_product" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "availability_requests" ADD CONSTRAINT "FK_availability_requests_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "FK_97913f35ac2e435a4463fb50a01" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "day_closures" ADD CONSTRAINT "FK_day_closures_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "FK_145532db85752b29c57d2b7b1f1" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "FK_9263386c35b6b242540f9493b00" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "FK_bd6d79fc38399711f5407ea118d" FOREIGN KEY ("replaced_by_product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "FK_order_items_pending_replacement_product" FOREIGN KEY ("pending_replacement_product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "FK_527dd6efd5f3402f729c6b3e826" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "FK_772d0ce0473ac2ccfa26060dbe9" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "product_price_history" ADD CONSTRAINT "FK_product_price_history_product" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "product_price_history" ADD CONSTRAINT "FK_product_price_history_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "FK_9c365ebf78f0e8a6d9e4827ea70" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tenant_product_categories" ADD CONSTRAINT "FK_tenant_product_categories_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "FK_109638590074998bb72a2f2cf08" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Tenant context helpers
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
$$;

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
$$;

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
$$;

-- Row-level security
ALTER TABLE "products" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "products" FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_products"
ON "products"
USING (tenant_id = app.current_tenant_id())
WITH CHECK (tenant_id = app.current_tenant_id());

ALTER TABLE "customers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "customers" FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_customers"
ON "customers"
USING (tenant_id = app.current_tenant_id())
WITH CHECK (tenant_id = app.current_tenant_id());

ALTER TABLE "orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "orders" FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_orders"
ON "orders"
USING (tenant_id = app.current_tenant_id())
WITH CHECK (tenant_id = app.current_tenant_id());

CREATE POLICY "tracking_token_lookup_orders"
ON "orders"
FOR SELECT
USING (
  current_setting('app.lookup_order_token', true) IS NOT NULL
  AND public_token = current_setting('app.lookup_order_token', true)
);

ALTER TABLE "product_price_history" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "product_price_history" FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_product_price_history"
ON "product_price_history"
USING (tenant_id = app.current_tenant_id())
WITH CHECK (tenant_id = app.current_tenant_id());

ALTER TABLE "day_closures" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "day_closures" FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_day_closures"
ON "day_closures"
USING (tenant_id = app.current_tenant_id())
WITH CHECK (tenant_id = app.current_tenant_id());
