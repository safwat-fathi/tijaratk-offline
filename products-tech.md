# 📘 Tijaratk – Products, Order Items & Alternatives

**Technical Design Document (MVP / Phase 1)**

---

## 1. Scope & Non-Goals

### In Scope

* Product creation (manual + catalog)
* Product persistence
* Order items modeling
* Free-text items
* Merchant-suggested alternatives
* Price handling at order level

### Explicitly Out of Scope (MVP)

* Barcode scanning
* Inventory tracking
* Automatic alternatives
* Related products
* Variants / SKUs
* Fixed product pricing

---

## 2. Core Principles (Engineering)

1. **Single source of truth**
2. **Order > Product**
3. **Prices are agreements, not attributes**
4. **Never block order creation**
5. **Merchant is the decision maker**
6. **Model WhatsApp chaos honestly**

---

## 3. Domain Overview

```
Merchant
 ├─ Products
 ├─ Orders
     └─ Order Items
```

* Products are **suggestions**
* Orders are **commitments**
* Order items are **historical facts**

---

## 4. Data Models

---

## 4.1 Products

### Purpose

Represent **sellable concepts**, not guaranteed inventory or prices.

---

### Table: `products`

```sql
products
--------
id (int, pk)

merchant_id (int, fk)

name (text, not null)
image_url (text, nullable)

source (enum)
  - manual
  - catalog
  - order_note

status (enum)
  - active
  - archived

created_at (timestamp)
updated_at (timestamp)
```

---

### Field Semantics

| Field       | Meaning                           |
| ----------- | --------------------------------- |
| `name`      | Arabic-facing product name        |
| `image_url` | Optional visual aid               |
| `source`    | Analytics only (never affects UX) |
| `status`    | Soft delete / hide                |

---

### Invariants

* Product **must not** require:

  * price
  * stock
  * category
* Product **can exist without ever being ordered**
* Product **can be created after an order**

---

## 4.2 Catalog Items (Internal)

### Purpose

Seed confidence, reduce typing.

---

### Table: `catalog_items`

```sql
catalog_items
-------------
id (int, pk)

name (text)
image_url (text)
category (text)

is_active (boolean)

created_at
```

---

### Usage Rules

* Catalog items are **read-only**
* No foreign keys to products
* Adding from catalog creates a **new product**

---

## 5. Orders & Items

---

## 5.1 Orders

> Orders are **agreements**, not carts.

```sql
orders
------
id (int, pk)
merchant_id (int)

customer_name (text)
customer_phone (text)
customer_address (text, nullable)

status (enum)
  - new
  - confirmed
  - out_for_delivery
  - completed
  - cancelled

total_price (decimal, nullable)

created_at
updated_at
```

---

## 5.2 Order Items

### Purpose

Capture **exactly what was agreed upon**, including ambiguity.

---

### Table: `order_items`

```sql
order_items
-----------
id (int, pk)
order_id (int, fk)

product_id (int, nullable)
name_snapshot (text, not null)

quantity (text)

unit_price (decimal, nullable)
total_price (decimal, nullable)

notes (text, nullable)

replaced_by_product_id (int, nullable)

created_at
```

---

### Field Semantics

| Field                    | Meaning                                     |
| ------------------------ | ------------------------------------------- |
| `product_id`             | Linked product if exists                    |
| `name_snapshot`          | What customer meant at order time           |
| `quantity`               | Free text (كيلو، 2، حسب الموجود)            |
| `unit_price`             | Merchant-confirmed                          |
| `total_price`            | unit_price × quantity (manual calc allowed) |
| `replaced_by_product_id` | Merchant-selected alternative               |

---

### Critical Rules

* `product_id` **may be NULL**
* `name_snapshot` is **always required**
* Order items **never mutate product data**
* Historical data **must not change retroactively**

---

## 6. Product Creation Flows

---

## 6.1 Manual Product Add (Primary)

### API

```
POST /products
```

### Payload

```json
{
  "name": "زيت عباد الشمس",
  "image_url": null
}
```

### Behavior

* Persist immediately
* No confirmation screen
* No validation beyond non-empty name

---

## 6.2 Catalog Add

### API

```
POST /products/from-catalog
```

### Payload

```json
{
  "catalog_item_id": "int"
}
```

### Server Logic

* Fetch catalog item
* Create new product
* Copy name + image
* Set source = `catalog`

---

## 7. Order Creation Flow

---

## 7.1 Customer Submits Order

Customer may:

* Select listed products
* Add free-text notes

### Payload Example

```json
{
  "items": [
    {
      "product_id": "int",
      "quantity": "2"
    },
    {
      "name": "عيش بلدي",
      "quantity": "حسب الموجود"
    }
  ]
}
```

---

## 7.2 Server Mapping

```ts
for each item:
  create order_item:
    product_id = item.product_id ?? null
    name_snapshot = product.name OR item.name
    quantity = item.quantity
```

🚫 No price calculation
🚫 No validation blocking

---

## 8. Alternative Product Flow (Merchant-Driven)

---

## 8.1 Trigger Condition

Merchant decides:

* Original item unavailable
* Better alternative exists

---

## 8.2 Merchant Action

In order inbox:

> “استبدال المنتج”

Merchant selects:

* Existing product
* Or manually adds product first

---

## 8.3 Data Update

```sql
UPDATE order_items
SET replaced_by_product_id = :newProductId
WHERE id = :orderItemId
```

---

## 8.4 Behavioral Rules

* Original `name_snapshot` is preserved
* No automatic replacement
* Customer is notified manually (call/WhatsApp)
* System records fact only

---

## 9. Pricing Flow

---

## 9.1 Price Entry Timing

Price is entered:

* During order confirmation
* By merchant only

---

## 9.2 Price Persistence

```sql
UPDATE order_items
SET
  unit_price = 25,
  total_price = 50
WHERE id = :orderItemId
```

Then:

```sql
UPDATE orders
SET total_price = SUM(order_items.total_price)
```

---

## 9.3 Customer Visibility

### Before confirmation

* No prices shown
* Message:

  > السعر يتم تأكيده بعد الطلب

### After confirmation

* WhatsApp message
* Tracking page update (optional)

---

## 10. Post-Order Product Capture (Optional, Manual)

---

### Prompt

> “هل تريد حفظ هذا المنتج؟”

If merchant confirms:

```sql
INSERT INTO products (
  merchant_id,
  name,
  source
)
VALUES (
  :merchantId,
  order_item.name_snapshot,
  'order_note'
)
```

---

## 11. Error Handling & Edge Cases

| Case                        | Handling                 |
| --------------------------- | ------------------------ |
| Missing product             | Free-text allowed        |
| Price missing               | Order stays `new`        |
| Replacement product deleted | Order keeps snapshot     |
| Product renamed             | Orders unaffected        |
| Merchant deletes product    | Historical orders intact |

---

## 12. Why This Architecture Works

* Models reality, not wishful thinking
* Prevents data corruption
* Allows future pricing models
* Allows inventory later
* Zero onboarding friction
* Merchant stays in control

---

## 13. Developer Mental Model (One Sentence)

> Products suggest, orders decide, items record history.

---

## 14. Ready for Next Phases

This design supports:

* Fixed pricing (opt-in)
* Inventory tracking
* Reorder flows
* Analytics
* Supplier linking

**Without schema rewrites.**

Short answer: **with the current doc, yes technically — but UX-wise it’s not explicit or strong enough for mobile-first merchant usage.**
So let’s **upgrade the flow** to make *merchant-selected alternatives* **fast, obvious, and WhatsApp-realistic** on mobile.

Below is the **updated, explicit flow** + **UI/UX rules** + **small schema clarification**.
No philosophy changes, just tightening execution.

---

# ✅ Updated: Merchant Alternative Selection Flow (Mobile-First)

## Goal (Very Clear)

Allow the merchant to:

* Open an order on mobile
* See unavailable items
* Select an alternative **in 1–2 taps**
* Without leaving the order
* Without typing unless they want to

This must feel like:

> “أنا بظبط الطلب بسرعة قبل ما أكلمه”

---

## 1️⃣ Order Details Screen (Merchant – Mobile)

### Each order item is rendered as a **card**

```
┌───────────────────────────┐
│ زيت عباد الشمس            │
│ الكمية: 2                 │
│ ———————————————            │
│ ⚠️ غير متوفر               │
│ [استبدال المنتج]          │
└───────────────────────────┘
```

### UX rules

* Items are **vertically stacked**
* Large tap targets
* No hidden menus
* No long-press
* One clear action per state

---

## 2️⃣ Tap “استبدال المنتج” → Bottom Sheet (NOT New Page)

Bottom sheet is critical for speed on mobile.

### Bottom Sheet Title

> اختر المنتج البديل

---

## 3️⃣ Alternative Selection UI (Merchant-Controlled)

### Section A – Quick Picks (Optional, Fast)

> منتجاتك

Scrollable list:

* Product name
* Optional image
* Tap to select

```
[ زيت ذرة ]
[ زيت صويا ]
[ زيت خليط ]
```

📌 **No system suggestion ranking**
📌 Just a flat list (maybe recently used first later)

---

### Section B – Add New Product (Always Available)

At the bottom:

```
+ إضافة منتج جديد
```

Tap → inline input (same screen):

```
[ اسم المنتج البديل ]
[ حفظ ]
```

➡️ Saves product
➡️ Immediately selects it as replacement

---

## 4️⃣ What Happens After Selection (Instant Feedback)

Order item card updates immediately:

```
┌───────────────────────────┐
│ زيت عباد الشمس            │
│ الكمية: 2                 │
│ ———————————————            │
│ 🔁 تم الاستبدال بـ: زيت ذرة │
│ [تغيير البديل]            │
└───────────────────────────┘
```

### UX Rules

* Original item name **always visible**
* Replacement clearly labeled
* One tap to change again
* No confirmation modal

---

## 5️⃣ Updated Data Flow (No Big Changes)

### Order Item Update

```ts
PATCH /order-items/:id/replace
{
  "replaced_by_product_id": "uuid"
}
```

Database remains:

```sql
replaced_by_product_id (uuid, nullable)
```

✅ No new tables
✅ No new entities
✅ No system intelligence

---

## 6️⃣ Price Entry Works Naturally After Replacement

When merchant enters prices:

* Price is entered **for the final agreed item**
* UI shows replacement name next to price input

Example:

```
زيت ذرة
[ سعر الوحدة ]  [ 25 ]
```

Original item remains for audit/history only.

---

## 7️⃣ Customer Communication (System Does NOT Decide)

System does **nothing automatically**.

Merchant:

* Calls customer
* Or WhatsApps customer
* Confirms alternative verbally

System:

* Just records the final agreement

---

## 8️⃣ Edge Cases (Handled Cleanly)

### Case 1: Merchant replaces, then deletes product later

* Order keeps:

  * `name_snapshot`
  * `replaced_by_product_id`
* Historical integrity preserved

---

### Case 2: Merchant wants to undo replacement

* Tap “تغيير البديل”
* Select original product again
* Or clear replacement

```ts
replaced_by_product_id = NULL
```

---

## 9️⃣ Why This UX Works in Egyptian Reality

* One-hand usage
* No typing pressure
* Mirrors phone-call flow
* Merchant feels in control
* No “system arguing with merchant”

This is **operations UX**, not e-commerce UX.

---

## 10️⃣ Final Answer to Your Question (Very Explicit)

> **Will this allow the merchant to select alternatives right away from the order details screen on mobile with good UX?**

### ❌ Before update

Technically yes, UX unclear.

### ✅ After this update

**Yes — fast, obvious, mobile-first, merchant-controlled, zero friction.**

This is now:

* implementable
* testable
* demo-ready
* field-sales friendly

