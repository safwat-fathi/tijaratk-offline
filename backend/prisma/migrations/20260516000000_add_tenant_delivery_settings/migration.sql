ALTER TABLE "tenants"
  ADD COLUMN "delivery_fee" DECIMAL(10, 2) NOT NULL DEFAULT 0,
  ADD COLUMN "delivery_available" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "delivery_time_window" VARCHAR(64);
