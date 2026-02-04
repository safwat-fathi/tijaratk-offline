# Plan: Add Tenant Category

## Summary
- Add a tenant `category` backed by a Postgres enum and validated in backend DTOs.
- Use constant objects with localized `en`/`ar` labels and reuse them across backend and frontend.
- Update signup flow and frontend register form to capture the category (defaulting to `other`).

## API / Types Changes
- Backend `SignupDto` adds optional `category` with validation.
- Backend `Tenant` entity `category` is an enum with default `other`.
- Frontend `RegisterRequest` includes `category`.
- Frontend `Tenant` model includes `category`.

## Steps
1. Create backend tenant category constants and types.
2. Update tenant entity, signup DTO, tenants service, and auth signup flow.
3. Add migration to create enum, normalize data, and enforce not-null default `other`.
4. Create frontend tenant category constants and types.
5. Update frontend register validation, register form, and signup action payload.
6. Update frontend tenant model type.

## Tests / Scenarios
- Signup without category should store `other`.
- Signup with each allowed category should succeed.
- Signup with invalid category should fail validation.
- Existing tenants with null or invalid category should become `other` after migration.
