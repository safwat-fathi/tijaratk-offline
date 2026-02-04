Perfect 👍
Below is a **PM-grade + engineering-ready document** you can hand to **designers, backend, and frontend** without re-explaining things.

I’ll keep it **practical, bootstrapped, and Egypt-realistic**, not theory.

---

# 📘 Customer Identification & Address Memory Flow

**Tijaratk – Product & Technical Specification**

---

## 1. Objective

Reduce friction for **repeat customers** while giving **merchants fast, reliable ways** to recognize and search customers — **without accounts, logins, or complexity**.

---

## 2. Product Principles

1. **No customer accounts**
2. **Phone number = identity**
3. **Merchant operations > customer dashboards**
4. **System-owned identifiers, merchant-friendly labels**
5. **Zero learning curve**

---

## 3. Core Concepts

### 3.1 Customer Identity

A customer is uniquely identified by:

* `tenant_id`
* `phone`

There is **no global customer** across tenants.

---

### 3.2 Customer Code (System-Owned)

* Auto-generated
* Numeric
* Unique **per tenant**
* Immutable
* Used internally for:

  * Search
  * Ops
  * Delivery coordination

Example:

```
#12
#37
#104
```

---

### 3.3 Merchant Label (Human-Friendly)

A **free-text nickname** merchants can add:

* Optional
* Editable anytime
* Not required to be unique

Examples:

* أبو أحمد
* الراجل اللي في آخر الشارع
* محل الموبايلات
* بتاع العصير

This matches **real Egyptian merchant behavior**.

---

## 4. Data Model

### 4.1 Customer Entity (Final)

```ts
Customer {
  id: uuid
  tenant_id: uuid

  phone: string
  name?: string

  code: number // system-generated, immutable
  merchant_label?: string // editable nickname

  last_address?: string
  notes?: string

  first_order_at?: timestamp
  last_order_at?: timestamp

  order_count: number
  completed_order_count: number

  created_at: timestamp
  updated_at: timestamp
}
```

---

### 4.2 Database Constraints

```sql
UNIQUE (tenant_id, phone)
UNIQUE (tenant_id, code)
```

Indexes:

```sql
INDEX (tenant_id, phone)
INDEX (tenant_id, code)
INDEX (merchant_label)
```

---

## 5. Customer Creation Flow (First Order)

### Step-by-step

1. Customer opens **merchant WhatsApp order link**
2. Enters:

   * Phone number
   * Name (optional)
   * Address
3. Submits order

### Backend Logic

```pseudo
if customer exists (tenant_id + phone):
    use existing customer
else:
    create customer
        code = next_increment_per_tenant
        phone = input.phone
        name = input.name
        address = input.address
        first_order_at = now
```

Order creation:

```pseudo
order.delivery_address = input.address
order.customer_id = customer.id
```

---

## 6. Repeat Order Flow (Key UX Win)

### What the customer sees

* Address field is **pre-filled**
* Microcopy:

  > 📍 تم استخدام آخر عنوان

Customer can:

* Confirm immediately
* Or edit address

### Backend Behavior

```pseudo
if address changed:
    customer.address = new_address
```

No DB hooks.
No magic.
**Explicit business logic only.**

---

## 7. Reorder Flow (Optional / Paid Feature Later)

### UX

Button:

```
🔁 اطلب نفس الطلب
```

### Behavior

* Items + quantities pre-filled
* Address pre-filled from `address`
* Customer confirms

This is **one-tap ordering**.

---

## 8. Merchant Customer Management Flow

### 8.1 Customer List View

Each row shows:

```
#12 – أحمد
🏷️ أبو أحمد (اختياري)
📞 010xxxx
📍 آخر عنوان
🛒 17 طلب
```

---

### 8.2 Search Behavior

Single search input supports:

* Customer code (`12`)
* Phone (`010`)
* Name
* Merchant label

This is critical for **busy merchants**.

---

### 8.3 Editing Merchant Label

Merchant can:

* Add or update `merchant_label`
* No validation except length limit

Example:

```ts
merchant_label = "أبو أحمد - آخر الشارع"
```

---

## 9. What Merchants CANNOT Do (By Design)

❌ Change customer code
❌ Delete and reuse codes
❌ Create their own numbering system

Why:

* Prevents collisions
* Prevents historical confusion
* Reduces support cases

---

## 10. Technical Implementation Details

### 10.1 Customer Code Generation

**Per merchant auto-increment**

Option A (Recommended – Simple & Safe):

* Maintain `tenant.customer_counter`
* Increment on customer creation

```pseudo
BEGIN TRANSACTION
  tenant.customer_counter += 1
  code = tenant.customer_counter
  create customer
COMMIT
```

---

### 10.2 Address Storage Strategy

| Location                 | Why                  |
| ------------------------ | -------------------- |
| `customer.address`  | Speed for next order |
| `order.delivery_address` | Historical accuracy  |

Never infer past addresses from customer table.

---

## 11. Edge Cases & Handling

### Same phone, different address

✅ Allowed
→ `address` updated

---

### Customer orders from multiple tenants

✅ Separate customers
→ Different codes, labels, stats

---

### Merchant wants to “remember” a customer

✅ Uses `merchant_label` or `notes`

---

## 12. Future Extensions (Non-MVP)

* Multiple saved addresses (Pro)
* Frequent items shortcut
* Delivery zone auto-detection
* Customer tagging (VIP / Late payer)

None of these block MVP.

---

## 13. Success Metrics

This flow is successful if:

* Repeat orders take **<15 seconds**
* Merchants search customers without phone scrolling
* Merchants say:

  > “بقيت أعرف الزباين بسرعة”
