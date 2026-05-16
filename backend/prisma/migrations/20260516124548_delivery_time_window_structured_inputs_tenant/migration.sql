/*
  Warnings:

  - You are about to drop the column `delivery_time_window` on the `tenants` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "tenants" DROP COLUMN "delivery_time_window",
ADD COLUMN     "delivery_ends_at" VARCHAR(5),
ADD COLUMN     "delivery_starts_at" VARCHAR(5);
