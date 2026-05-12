# Add Supermarket Merchant Seeder

## Goal

Seed a realistic supermarket merchant with an owner login user and many products.

## Implementation

- Add a new TypeORM seeder under `backend/src/common/seeders`.
- Create or reuse a fixed grocery tenant for the supermarket merchant.
- Create or reuse an owner user linked to that tenant.
- Seed many supermarket products across relevant categories with prices and order configuration.
- Seed tenant product categories for the merchant.
- Make all seed operations idempotent so repeated runs do not duplicate data.
- Call the new seeder from `backend/src/common/seed.ts` after the catalog seeder.

## Verification

- Run backend lint/type verification where feasible.
