Below is a **full technical document** for the feature:

> **Feature:** Suggest Similar Products (for Replace Item & Product Search)
> **Project:** Tijaratk (تجارتك)
> **Context:** Multi-tenant SaaS for Egyptian online stores
> **Goal:** Accurate, fast, low-cost similarity suggestions (MVP-first)

---

# 1) Problem Statement

When a merchant replaces an order item (e.g., **أرز أبيض الضحى 1ك**) or searches for a product:

We must:

* Suggest **only relevant products**
* Avoid cross-category pollution (e.g., منظفات when replacing أرز)
* Work in multi-tenant context
* Keep infra cost minimal (bootstrapped SaaS)
* Support Arabic names

---

# 2) High-Level Strategy

We use a **3-layer similarity architecture**:

### Layer 1 — Deterministic (Best Quality)

If available:

* `catalog_item_id` match (same product family)
* OR same structured attributes (product_type)

### Layer 2 — Category Guard

Restrict results to:

* Same `category_id`

### Layer 3 — Trigram Similarity (pg_trgm)

Use PostgreSQL `pg_trgm` to:

* Filter candidates using `%`
* Rank using `similarity()`

---

# 3) Architecture Overview

```
Merchant Action (Replace Item / Search)
        ↓
Normalize Search Input (Arabic-safe)
        ↓
Apply Filters:
   1) tenant_id
   2) status = active
   3) catalog_item_id (if exists)
   4) category_id (fallback)
   5) trigram match (%)
        ↓
Rank by similarity DESC
        ↓
Return Top N (10–20)
```

---

# 4) Database Requirements

## 4.1 Required Columns (products table)

```sql
products (
  id UUID / INT,
  tenant_id UUID / INT,
  name TEXT,
  status VARCHAR,
  category_id UUID NULL,
  catalog_item_id UUID NULL,
  created_at TIMESTAMP,
  ...
)
```

---

## 4.2 Required Extensions

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

---

## 4.3 Required Indexes

### Trigram Index (Active Only)

```sql
CREATE INDEX IDX_products_name_trgm_active
ON products
USING GIN (LOWER(name) gin_trgm_ops)
WHERE status = 'active';
```

### Tenant Filter Index

```sql
CREATE INDEX IDX_products_tenant_active
ON products (tenant_id)
WHERE status = 'active';
```

Postgres will combine them via bitmap index scan.

---

# 5) Arabic Normalization (Critical for Egypt)

Arabic requires lightweight normalization for better matching.

## 5.1 Normalization Rules

At minimum:

* Replace `أ`, `إ`, `آ` → `ا`
* Replace `ى` → `ي`
* Optionally `ة` → `ه`
* Remove extra spaces
* Lowercase
* Remove duplicate spaces
* Optionally strip size tokens:

  * 1ك
  * 500جم
  * 250g
  * etc.

---

## 5.2 Example Normalizer (TypeScript)

```ts
export function normalizeArabic(input: string): string {
  return input
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/\s+/g, ' ')
    .trim();
}
```

Optional advanced stripping can be added later.

---

# 6) Replace Item Suggestion Logic

## 6.1 Scenario A — Order item has product_id

1. Load product
2. If product.catalog_item_id exists:

   * Return products with same `catalog_item_id`
3. Else:

   * Use category_id + trigram similarity

---

## 6.2 Scenario B — Free Text Order Item

Example:

```
رز ابيض 2 كيلو
```

Flow:

1. Normalize text
2. Filter by category if possible
3. Apply trigram `%`
4. Rank by similarity
5. Return top 10

---

# 7) SQL Query Design (Core)

## 7.1 Basic Trigram Search Query

```sql
SELECT *,
       similarity(LOWER(name), :q) AS search_rank
FROM products
WHERE tenant_id = :tenantId
  AND status = 'active'
  AND LOWER(name) % :q
ORDER BY search_rank DESC
LIMIT 20;
```

---

## 7.2 With Category Guard

```sql
AND category_id = :categoryId
```

---

## 7.3 With Similarity Threshold

```sql
AND similarity(LOWER(name), :q) >= 0.25
```

Recommended initial threshold:

* 0.20 → more results
* 0.30 → stricter

Tune after real data testing.

---

# 8) TypeORM Implementation (NestJS)

```ts
const q = normalizeArabic(search);

const qb = this.productRepo
  .createQueryBuilder('p')
  .where('p.tenant_id = :tenantId', { tenantId })
  .andWhere(`p.status = 'active'`);

if (categoryId) {
  qb.andWhere('p.category_id = :categoryId', { categoryId });
}

qb.andWhere('LOWER(p.name) % :q', { q })
  .addSelect('similarity(LOWER(p.name), :q)', 'search_rank')
  .orderBy('search_rank', 'DESC')
  .limit(20);

return qb.getMany();
```

---

# 9) Performance Expectations

With proper indexing:

* 1k products → < 10ms
* 5k products → < 30ms
* 10k products → ~50ms

Per tenant, not global.

This is fully acceptable for MVP.

---

# 10) UX Behavior Design

## Replace Modal Structure

### Section 1 — Same Item (if catalog match exists)

* Exact family matches

### Section 2 — Closest Alternatives

* Top trigram matches

### Always Include:

* Manual search input
* Clear similarity ordering

---

# 11) Edge Cases Handling

### Case: Similarity returns unrelated items

Fix:

* Increase threshold
* Require same category
* Later: add catalog mapping

---

### Case: Merchant has 2–3 products only

Fallback:

* Skip trigram filter
* Just return all active products

---

### Case: Arabic typos

Trigram handles most minor typos automatically.

---

# 12) Future Upgrade Path (Phase 2+)

When product base grows:

### Add:

* `catalog_items` (product families)
* Barcode mapping
* Structured attributes
* word_similarity()
* Full-text search combination

### Later:

* Hybrid FTS + Trigram
* Embeddings (optional)

---

# 13) Why Not Use Only Full Text Search?

FTS in Arabic:

* Requires dictionary tuning
* Harder for partial names
* Not ideal for short product names

Trigram:

* Works immediately
* Handles typos
* Works for short strings

Best MVP choice.

---

# 14) Security & Multi-Tenant Rules

Always enforce:

```sql
WHERE tenant_id = :tenantId
```

Never allow cross-tenant similarity search.

---

# 15) MVP Decision Summary

| Component            | Needed for MVP? | Decision |
| -------------------- | --------------- | -------- |
| pg_trgm              | ✅ Yes           | Required |
| GIN index            | ✅ Yes           | Required |
| Tenant filter index  | ✅ Yes           | Required |
| Arabic normalization | ✅ Yes           | Minimal  |
| Catalog mapping      | ❌ Optional      | Phase 2  |
| Embeddings           | ❌ No            | Overkill |

---

# 16) Final Recommendation for Tijaratk

For a bootstrapped SaaS serving Egyptian merchants:

👉 **pg_trgm + tenant filter + category guard + lightweight Arabic normalization is fully enough for MVP.**

It gives:

* Correct replacements
* Good Arabic matching
* Low infra cost
* Simple maintenance
* Predictable performance

---

If you'd like, I can now write:

* A **test plan** (unit + integration)
* Or a **benchmark strategy**
* Or a **data-driven similarity tuning guide for Egyptian grocery names**
