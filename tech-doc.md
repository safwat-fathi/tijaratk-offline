# Tijaratk (تجارتك)

## Technical Specification – MVP Reference

> **Audience:** Software engineers (backend, frontend, DevOps)
>
> **Goal:** Provide a single, authoritative technical reference for building and maintaining the Tijaratk MVP.
>
> **Scope:** Grocery, greengrocer (فكهاني), and similar offline-first merchants in Egypt.

---

## 1. System Overview

Tijaratk is a **bootstrapped, operations-first SaaS** that enables local merchants to receive **structured orders** from customers via WhatsApp links and manage those orders through a seller dashboard.

### Core Characteristics

* WhatsApp-first (as an entry & notification channel)
* No customer accounts or logins
* Cash-on-delivery by default
* Arabic-first UX
* Multi-tenant architecture
* Designed for daily operational usage

WhatsApp is **not a system of record**. The backend database is the single source of truth.

---

## 2. Architectural Principles

1. **Separation of Concerns**

   * Frontend (Next.js) handles rendering and user interaction
   * Backend (NestJS) handles business logic and data integrity

2. **Tenant Isolation**

   * All seller data is scoped to a tenant
   * Cross-tenant access is impossible by design

3. **Global Customers & Products**

   * Customers are global (identified by WhatsApp number)
   * Products are global concepts, customized per store

4. **MVP Discipline**

   * No premature inventory management
   * No online payments
   * No complex permissions system

---

## 3. Tech Stack

### Frontend

* Next.js (App Router)
* TypeScript
* TailwindCSS
* Server Actions (simple mutations)
* Fetch API for backend communication

### Backend

* NestJS
* RESTful APIs
* TypeORM
* class-validator / class-transformer
* Background jobs (cron – minimal usage in MVP)

### Database

* PostgreSQL
* INT SERIAL primary keys
* PostGIS extension (for store locations)

---

## 4. Core Domain Concepts

### 4.1 Tenant

Represents a **merchant business**.

* One tenant can have multiple stores
* One tenant can have multiple users (owner + staff)

```
Tenant
- id (SERIAL)
- name
- created_at
```

---

### 4.2 User (Seller / Staff)

Represents a **human operator** of the system.

* Users authenticate
* Users belong to exactly one tenant

```
User
- id (SERIAL)
- tenant_id (INT FK)
- phone
- role (owner | staff)
- created_at
```

Users are the only authenticated actors in the system.

---

### 4.3 Store

Represents a **physical branch**.

* A tenant may have one or multiple stores
* Orders always belong to a store

```
Store
- id (SERIAL)
- tenant_id (INT FK)
- name
- is_active
- location (PostGIS Point)
```

---

### 4.4 Customer (Global)

Represents an **end customer**.

* Customers do not log in
* Customers are identified by WhatsApp number
* Customers can order from multiple stores

```
Customer
- id (SERIAL)
- whatsapp_number (unique)
- name
- created_at
```

---

### 4.5 Product (Global)

Represents a **canonical product concept**.

Examples:

* Tomatoes
* Milk
* Bananas

```
Product
- id (SERIAL)
- canonical_name
- category (optional)
- created_at
```

Products never store price or availability.

---

### 4.6 StoreProduct

Represents a **product offered by a specific store**.

```
StoreProduct
- id (SERIAL)
- tenant_id (FK)
- store_id (FK)
- product_id (FK)
- display_name
- is_active
```

Constraints:

* Unique (store_id, product_id)

---

### 4.7 StoreProductVariant

Represents **sellable units** for a store product.

Examples:

* 1 kg
* Half kg
* Box

```
StoreProductVariant
- id (SERIAL)
- store_product_id (FK)
- label
- unit_value (optional)
- price
- is_default
- is_active
```

Rules:

* Exactly one default variant per store product
* Variants are store-scoped

---

### 4.8 Order

Represents a **customer order**.

```
Order
- id (SERIAL)
- tenant_id (FK)
- store_id (FK)
- customer_id (FK)
- status
- total_price
- delivery_fee
- address
- notes
- source (whatsapp | direct)
- created_at
```

Statuses:

* NEW
* CONFIRMED
* OUT_FOR_DELIVERY
* COMPLETED
* CANCELLED

---

### 4.9 OrderItem

Represents an item inside an order.

```
OrderItem
- id (SERIAL)
- order_id (FK)
- store_product_variant_id (FK)
- quantity
- price_at_order
```

Order items always snapshot price at the time of ordering.

---

## 5. Database Design Principles

* All seller-facing tables include `tenant_id`
* Customers and products are global
* UUIDs are used everywhere
* Soft deletes are avoided in MVP
* Index heavily on:

  * tenant_id
  * created_at
  * status

---

## 6. API Design (High-Level)

### Seller APIs (Authenticated)

* Create / update products & variants
* View and manage orders
* Change order status
* View daily summaries

### Customer APIs (Unauthenticated)

* View store catalog
* Create order
* Track order status

---

## 7. Order Creation Flow

1. Customer opens store order link
2. Frontend fetches store catalog
3. Customer submits order
4. Backend:

   * Finds or creates customer by WhatsApp number
   * Validates store & variants
   * Calculates totals
   * Creates order + order items (transaction)
5. WhatsApp notification sent to seller
6. Customer receives tracking link

---

## 8. WhatsApp Integration

* WhatsApp is used for:

  * Order notifications
  * Order tracking links
  * Onboarding messages

* WhatsApp messages are **side effects**, never core logic

---

## 9. Multi-Tenancy Rules

* Every request from sellers resolves tenant context
* Tenant ID is never passed from frontend blindly
* Backend enforces tenant ownership on every query

---

## 10. What Is Explicitly Out of Scope (MVP)

* Online payments
* Inventory tracking
* Discount systems
* Customer accounts
* Advanced RBAC
* Marketing automation

---

## 11. Future-Safe Extensions (Post-MVP)

* Inventory & stock tracking
* Delivery zones & pricing
* Customer reorder flows
* Analytics & insights
* Mobile app

---

## 12. Guiding Philosophy (For Developers)

> If a feature does not reduce daily operational pain for the merchant, it does not belong in the MVP.

This document is the **source of truth**. Any deviation should be intentional and documented.

---

**End of Document**
