# Tijaratk – Product Adding Feature

## Supermarket Product Onboarding (Non-Barcode)

### Version

MVP / Phase 1

### Target Merchants

* Neighborhood supermarkets
* Mini-markets
* Grocery stores
* Low–medium technical literacy
* WhatsApp-first operators

---

## 1. Objective

Enable merchants to add products **fast enough** to:

* Receive their **first real order**
* Feel immediate value
* Avoid setup fatigue
* Not feel like they’re “building an online store”

Success is **not** measured by number of products added.
Success is measured by:

* First order received within 24 hours
* Daily usage of the order inbox
* Merchant confidence

---

## 2. Core Principles

1. **Speed over completeness**
2. **Optional, not mandatory**
3. **Arabic-first mental models**
4. **Familiar workflows**
5. **Zero setup pressure**
6. **Progressive enhancement**

> The merchant should feel:
> “أنا أقدر أبدأ، والباقي ييجي بعدين”

---

## 3. The Two Product Adding Approaches

### Approach A: Quick Manual Add (Primary)

### Approach B: Grocery Catalog Pick (Secondary)

Both approaches:

* Lead to the **same product object**
* Can be mixed freely
* Do not enforce structure
* Do not require prices

---

## 4. Approach A – Quick Manual Add (Default Path)

### Purpose

Enable the fastest possible product creation with **minimal thinking**.

This is the **hero flow** and should be visually emphasized.

---

### 4.1 When It Is Used

* First-time merchant onboarding
* Field sales demo
* Merchants adding fast-moving items
* Merchants with changing prices

---

### 4.2 Required Fields

| Field         | Required   | Notes             |
| ------------- | ---------- | ----------------- |
| Product name  | ✅ Yes      | Arabic text       |
| Product image | ❌ Optional | Camera or gallery |

**No price**
**No category**
**No stock**
**No SKU**

---

### 4.3 UX Flow (Mobile-First)

1. Merchant clicks **“إضافة منتج”**
2. Single input screen:

   * Big text field
   * Placeholder example:

     > "مثال: زيت عباد الشمس"
3. CTA:

   * “حفظ”
4. Optional image step:

   * “أضف صورة (اختياري)”
   * Skip allowed
5. Product saved instantly

No confirmation screens.
No modals.
No success animations.

---

### 4.4 UX Rules

* One primary action per screen
* Large font
* Arabic placeholders
* Keyboard-focused
* Back button never loses data

---

### 4.5 Operational Rationale

* Matches WhatsApp typing behavior
* Works even with unstable pricing
* Allows starting with 5–10 products
* Reduces cognitive load
* Ideal for Egyptian store reality

---

## 5. Approach B – Grocery Catalog Pick

### Purpose

Reduce typing and increase confidence using **ready-made generic products**.

This is **not** a full product database.
It is a **starter catalog**.

---

### 5.1 What the Catalog Is

* A **curated list** of common grocery items
* Generic naming
* Neutral images
* No brands dependency
* No prices
* No variants

Think:
“منتجات جاهزة تختار منها”
Not:
“قاعدة بيانات سوبرماركت”

---

### 5.2 What the Catalog Is NOT

❌ Not brand-accurate
❌ Not exhaustive
❌ Not SKU-based
❌ Not price-aware
❌ Not enforced

---

### 5.3 Catalog Structure

#### Categories (Initial)

* بقالة
* ألبان
* زيت وسمن
* أرز ومكرونة
* سكر وملح
* مشروبات
* فاكهة
* خضار
* مجمدات
* حلويات خفيفة

Each category contains **10–20 items max**.

Total initial catalog size:
**100–150 products**

---

### 5.4 Product Data Model (Catalog Item)

| Field    | Value               |
| -------- | ------------------- |
| Name     | Generic Arabic name |
| Image    | One neutral image   |
| Category | For browsing only   |

No IDs exposed to merchant.
No editing required on add.

---

### 5.5 UX Flow

1. Merchant clicks:
   **“اختار من منتجات جاهزة”**
2. Sees category tiles
3. Selects category
4. Sees product cards:

   * Image
   * Product name
   * ➕ Add
5. Tap “Add”:

   * Product is added immediately
   * Toast: “تمت الإضافة”
6. Merchant continues browsing or exits

No price prompts.
No edit screen after adding.

---

### 5.6 Post-Add Behavior

After adding from catalog:

* Product appears exactly like manually added products
* Merchant can:

  * Edit name
  * Add image
  * Delete product
* No visible difference between catalog/manual products

---

## 6. Interaction Between the Two Approaches

* Both create the same internal product structure
* Merchants can:

  * Add some products manually
  * Add some from catalog
* No limits
* No hierarchy

This avoids confusion and training overhead.

---

## 7. Edge Cases & Egyptian Reality Handling

### 7.1 Missing Products

If product is not found in catalog:

* Manual add is always available
* Notes field in order covers gaps

### 7.2 Price Changes

* Prices are not required at product level
* Price can be:

  * Agreed in chat
  * Added later
  * Handled per order

### 7.3 Unlisted Items

Customer can:

* Write custom notes
* Request items not listed

System must **never block orders**.

---

## 8. What We Explicitly Avoid in MVP

* Barcode scanning
* Product variants
* Brand enforcement
* Size-based SKUs
* Mandatory pricing
* Inventory stock counts

These are **trust-stage features**, not onboarding features.

---

## 9. Success Metrics

### Activation Metrics

* Time to add first product < 1 minute
* Products added in first session ≥ 5
* First order within 24 hours

### Retention Indicators

* Products added gradually over days
* Repeat orders using same products
* Merchant edits products over time

---

## 10. Summary for Stakeholders

* Product adding is an **enabler**, not a goal
* Manual add is the backbone
* Catalog is a confidence booster
* Simplicity wins adoption
* Completeness kills momentum

> Tijaratk does not digitize the store.
> It digitizes the **order chaos**.

Love it. This is the right moment to **lock the foundation** before features creep in.

Below is a **full technical document** you can hand to:

* backend engineers
* frontend engineers
* QA
* future-you in 6 months

It is **MVP-clean**, **Egypt-realistic**, and **future-safe**.

---

