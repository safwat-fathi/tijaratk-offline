# Auth and Users Module Implementation Plan

## Goal
Implement the `Auth` and `Users` modules to enable seller/staff authentication as per `tech-doc.md` specifications.

## Scope
- Create `Users` module (Entity, Service, Controller).
- Create `Auth` module (Service, Controller, JWT Strategy).
- Define `User` entity relationships (Tenant).

## Proposed Changes

### 1. Users Module
- **Generate Module:** `nest g module users`
- **Generate Controller:** `nest g controller users`
- **Generate Service:** `nest g service users`
- **Entity:** `src/users/entities/user.entity.ts`
    - `id`: SERIAL (Primary Key)
    - `tenant_id`: INT (Foreign Key to Tenant)
    - `phone`: String (Unique)
    - `role`: Enum ('owner' | 'staff')
    - `created_at`: Date
    - `password`: String (Added for authentication purposes, hashed)
- **Repo:** Register `User` entity in `TypeOrmModule`.

### 2. Auth Module
- **Generate Module:** `nest g module auth`
- **Generate Controller:** `nest g controller auth`
- **Generate Service:** `nest g service auth`
- **Dependencies:** `passport`, `@nestjs/passport`, `@nestjs/jwt`, `passport-jwt`, `bcrypt`.
- **functionality:**
    - `login(phone, password)`: Returns JWT access token.
    - `register(phone, password, tenant_id)`: Registers a new user.
    - `JwtStrategy`: Validates token and extracts user info (id, tenant_id, role).

### 3. Tenant Integration
- Ensure `User` entity has a Many-to-One relationship with `Tenant`.
