# Tijaratk – Customer Order Page

## UI / UX Guide (Mobile-First, Egypt-Focused)

### Document Purpose

This document guides the design of the **store slug order page** that customers open from WhatsApp.
The goal is to **maximize completed orders** with **minimum thinking**, respecting **Egyptian customer behavior** and **offline-first commerce reality**.

This is **not an e-commerce product page**.
This is a **WhatsApp-native order entry page**.

---

## 1. Core UX Principles (Non-Negotiable)

Design decisions MUST follow these principles:

1. **Manual order is a first-class action**

   * Not a fallback
   * Not hidden
   * Not secondary

2. **Zero thinking, zero exploration**

   * User must know what to do in <3 seconds

3. **Mobile-first only**

   * Assume 90% usage on low-to-mid Android phones

4. **Forgiving UX**

   * Users can ignore products
   * Users can type anything
   * System adapts, not the user

5. **Trust before features**

   * Always show store identity
   * Reassure that the store will confirm the order

---

## 2. Page Structure (Vertical Flow)

### High-Level Layout Order

1. Sticky Store Header ✅
2. Manual Order Entry (primary action)
3. Product List (if exists – secondary)
4. Delivery Details
5. Sticky Bottom Action (Confirm Order)

---

## 3. Sticky Store Header (Always Visible)

### Purpose

* Anchor trust
* Provide a clear, immediate action
* Prevent dead ends

### Behavior

* Stays visible on scroll
* Height: **compact**
* No collapse animation

### Content (Required)

* Store name
* Optional category badge (e.g. Grocery, Greengrocer)
* Primary CTA: **Write your order**

### CTA Behavior

* On tap:

  * Scrolls to “Order Notes”
  * Auto-focuses text area
  * Opens keyboard

### Copy Guidelines

Use human, reassuring language.

**Recommended CTA text:**

* “✍️ Write your order”

Avoid:

* “Manual order”
* “Custom order”
* Any technical terms

---

## 4. Manual Order Section (Primary Interaction)

### Position

* Immediately visible without scrolling
* Or reachable instantly via sticky CTA

### Visual Importance

* Must feel like the **main action**
* Same or higher visual weight than products

### Section Title

**Order Notes**

### Input Field

* Multiline textarea
* Large tap area
* Placeholder examples are critical

**Placeholder examples:**

* “1kg tomatoes, 2 packs of sugar…”
* “عيش، لبن، زيت”
* “أي نوع مكرونة ينفع”

### Helper Text (Trust Reinforcement)

Short, calm reassurance:

> “The store will confirm price and availability with you.”

This reduces fear of “ordering wrong”.

---

## 5. Product List (Optional, Secondary)

### When Products Exist

* Products must **not block** manual ordering
* Do NOT push manual order to the bottom

### Display Rules

* Show first **3–5 products only**
* Each product:

  * Name
  * Price
  * Simple quantity control

### Divider After Products

Clear visual separator:

> “— OR —”

Then show a text link or button:

> ✍️ Prefer to write your order?

This reinforces choice, not hierarchy.

---

## 6. Empty Product State (Critical Case)

When no products exist:

### Do NOT:

* Show empty lists
* Use apologetic language
* Make page feel broken

### Do:

* Clearly state availability
* Push manual order immediately

**Recommended copy:**

> “No products listed yet.
> Just write your order below.”

This must appear **above the Order Notes**, not as a footnote.

---

## 7. Delivery Details Section

### Purpose

Collect only what’s necessary to fulfill the order.

### Fields (Required)

1. Full Name
2. Phone Number

   * Egyptian format
   * Numeric keyboard
3. Delivery Address

   * Single free-text field
   * No maps in MVP

### Optional Field

* Delivery Notes (e.g. “ring the bell”, “leave at door”)

### UX Rules

* Clear labels
* No validation anxiety
* Errors only on submit

---

## 8. Sticky Bottom Action Bar

### Purpose

Provide a clear, always-available completion action.

### Content

* Total Estimated
* Confirm Order button

### Total Estimated Behavior

* If products selected → show estimate
* If manual order only:

  * Show **“Price will be confirmed by the store”**
  * Or keep total visually muted

⚠️ Avoid misleading “0.00 EGP” without explanation.

---

## 9. Confirm Order Button

### Behavior

* Always visible
* Disabled only if required fields missing

### Copy

**“Confirm Order”**

Avoid:

* “Checkout”
* “Place Order”
* Any e-commerce jargon

---

## 10. Error Handling & Edge Cases

### If user submits empty order notes + no products

* Soft validation:

  > “Please write your order or select items.”

### If phone number invalid

* Simple inline error
* No red walls or modals

---

## 11. Visual Style Guidelines

* Clean
* High contrast
* Large tap targets
* Minimal icons
* No decorative clutter

This is an **operations tool**, not a lifestyle app.

---

## 12. Success Criteria (UX KPIs)

The design is successful if:

* User starts typing within 5 seconds
* Orders are completed without scrolling confusion
* Merchants say:

  > “الناس بتفهم اللينك بسرعة”

Failure signals:

* High page exits
* Merchants still receiving unstructured WhatsApp messages
* Users asking “أطلب إزاي؟”

---

## 13. One-Line Design North Star

> **“The fastest way for a customer to type what they want and send it to the store.”**

Everything else is secondary.

