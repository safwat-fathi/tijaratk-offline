Below is a **product-level UI/UX guideline** you can hand directly to the designer.
It is written from a **merchant-ops mindset**, mobile-first, and grounded in **Egyptian daily store behavior** and the WhatsApp-first philosophy of Tijaratk .

---

# Merchant Dashboard – Orders Page

## UI/UX Design Guidelines (Mobile-First)

### 1. Purpose of the Orders Page (Non-Negotiable)

The orders page is **the heart of the product**.

If this page fails:

* The merchant won’t open the dashboard daily
* WhatsApp chaos returns
* The product feels “extra work”

**Primary job of this page:**

> Help a busy merchant *see*, *decide*, and *act* on orders in seconds.

This page is **not** for analytics, settings, or growth.
It is for **today’s work**.

---

## 2. Merchant Reality (Design Empathy)

Design for this person:

* Standing in the shop
* One hand holding the phone
* Customers waiting
* Phone buzzing with WhatsApp messages
* Low patience for complex UI
* Thinks in **orders**, not “records”
* Thinks in **now**, not “filters”

**Design implication:**

* Big tap targets
* Minimal reading
* Clear hierarchy
* Zero hidden complexity

---

## 3. Core UX Principles

### A. Mobile-First, Desktop-Second

* Design **mobile first**
* Desktop is a stretched version, not a separate experience

### B. Status-Driven UX

Orders are understood by **status**, not by time or ID.

Statuses must feel like **physical workflow steps**:

* New → Confirmed → Out for Delivery → Completed
* Cancelled = visually separate, not mixed

### C. One Screen = One Decision

On first load, merchant should immediately know:

* How many new orders?
* Which one needs action now?

---

## 4. Orders Page Information Architecture

### Page Structure (Top → Bottom)

#### 1. Sticky Header (Very Important)

Always visible.

Contains:

* **Page title:** “Orders”
* **Today indicator:** “Today – 12 Orders”
* Optional date switch (Today / Yesterday) — **not a calendar**

Why:

* Merchants think per day
* Sticky header anchors them

---

#### 2. Status Tabs (Primary Navigation)

Horizontal tabs, scrollable if needed:

* New (🔥 highlight)
* Confirmed
* Out for Delivery
* Completed
* Cancelled (last, muted)

**Rules:**

* Show **count badge** on each tab
* “New” must stand out visually (color or dot)
* Default tab = **New**

Avoid:

* Filters
* Dropdowns
* Advanced sorting

---

#### 3. Orders List (Main Area)

A **simple vertical list** of order cards.

Each card must be:

* Finger-friendly
* Scannable in 2 seconds
* Action-oriented

---

## 5. Order Card Design (Critical)

### Order Card Content (Minimum Required)

**Top Row**

* Customer name (or “New Customer”)
* Time (e.g. “12:40 PM”)
* Order total (bold)

**Middle**

* Short items preview
  Example:
  `2 × Tomatoes, 1 × Milk, +3 items`

**Bottom**

* Delivery area (if exists)
* Payment: “Cash”

---

### Visual Hierarchy Rules

* Customer name & total = highest contrast
* Items list = secondary
* Meta info = lighter color

Avoid icons overload. Text > icons.

---

### Order Card Actions

**Do NOT show all actions at once.**

Instead:

* Tapping the card → Order Details screen
* OR
* One **primary action button** per status

Example:

* New → “Confirm Order”
* Confirmed → “Out for Delivery”
* Out for Delivery → “Complete”

This reduces thinking.

---

## 6. Order Details Screen

This is where actions happen.

### Layout

* Full screen
* No modal sheets (too fragile)

### Content Order

1. Customer info (name, phone – tappable)
2. Order items (clear list)
3. Notes (if any – highlighted)
4. Delivery details
5. Order total breakdown
6. Primary action button (sticky at bottom)

---

### Action Buttons (Very Important)

Only **one primary action** at a time.

Example:

* Big button: “Confirm Order”
* Secondary: “Cancel Order” (less visual weight)

Avoid:

* Multiple equal buttons
* Floating icons

---

## 7. Status Change UX

When status changes:

* Immediate visual feedback
* Short confirmation (“Order confirmed”)
* Auto-move to next tab

No toasts that disappear too fast.
No animations that feel “app-y”.

This is a **work tool**, not a social app.

---

## 8. Empty States (Very Important)

Empty states must **reduce anxiety**, not look broken.

Examples:

* New tab empty:

  > “No new orders yet. Orders will appear here automatically.”

* Completed empty (early day):

  > “Completed orders will appear here today.”

Use:

* Friendly Arabic copy (later)
* Simple illustration (optional, very light)

---

## 9. Error & Edge Cases

Design for reality:

### A. Free-Text Orders

If order has free-text items:

* Highlight “Customer notes”
* Items list may be less structured
* Do NOT treat as error

### B. Phone Call Orders (Manual Entry)

If order is manually added:

* Badge: “Manual”
* Same UI as others (do not special-case too much)

---

## 10. Performance & Perceived Speed

* Skeleton loading > spinners
* Load **New orders first**
* Avoid pagination (use infinite scroll if needed)

Merchants equate speed with trust.

---

## 11. Visual Style Guidance

* Calm colors
* High contrast for actions
* Avoid playful or gamified visuals
* Typography > icons

Think:

> “Accounting notebook” not “startup app”

---

## 12. Things to Explicitly Avoid

❌ Complex filters
❌ Advanced analytics on this page
❌ Hidden gestures
❌ Long onboarding tooltips
❌ Desktop-only assumptions

---

## 13. Success Criteria (UX KPI)

This page is successful if:

* Merchant opens it multiple times per day
* Merchant can confirm an order in <10 seconds
* Merchant feels stressed when it’s unavailable

Not measured by:

* Time spent
* Click counts
* Fancy animations

---

## Final Note to Designer

Design this page like:

> You are late, shop is busy, phone is ringing, and you just want clarity.

If the design works in that moment — it works.

========

## First: understand the merchant mental model (very important)

Merchants **do NOT think in dates**.

They think in:

* **“النهارده”** (today)
* **“امبارح”** (yesterday)
* “طلبات قبل كده” (older orders)

If you expose a calendar by default, you’re already losing them.

So the rule is:

> **Date selection must feel like time navigation, not date picking**

---

## ✅ Best Option (Recommended):

### “Today / Yesterday / Older” segmented control

### How it fits YOUR current design

You already have this pill:

> **Today · 10 Orders**

This is PERFECT. Don’t replace it — **upgrade it**.

---

### UI behavior

* The pill is **clickable**
* On tap → opens a **bottom sheet** (mobile-first)
* Shows **3 simple options**

#### Bottom Sheet Content

```
Orders for

● Today
○ Yesterday
○ Older orders
```

Optional (only inside “Older”):

* “Pick a date” → opens calendar **only then**

---

### Why this works

* 90% of usage = Today / Yesterday
* Calendar is hidden until truly needed
* Zero cognitive load
* Arabic-friendly
* Works with one thumb

---

### Visual example (conceptual)

**Header stays the same:**

```
Orders        [ Today · 10 Orders ▾ ]
```

Tap ▾ → bottom sheet slides up.

---

## ⚠️ What NOT to do (very important)

### ❌ Do NOT add:

* Calendar icon in header
* Date input field
* Horizontal date scroller (Mon Tue Wed)
* Swipe gestures for dates (discoverability issue)

Merchants will:

* Miss it
* Misunderstand it
* Ignore it

---

## 🥈 Second-best Option (Acceptable, but weaker)

### Horizontal Day Chips (Only if you insist)

```
[ Today ] [ Yesterday ] [ 2 days ago ]
```

Problems:

* Doesn’t scale
* Breaks after a week
* Eats vertical space
* Becomes confusing fast

Only use this if you **never** want older history.

---

## 🥉 Worst Option (Avoid completely)

❌ Calendar-first UI
❌ Date picker modal
❌ “From / To” ranges

These are **accounting tools**, not daily ops tools.

---

## How date change should FEEL

When merchant switches date:

* Orders list updates instantly
* Status tabs still work the same
* Counts update per date
* No reload spinner if possible

Mentally:

> “أنا رجعت ليوم امبارح”

Not:

> “أنا غيرت فلتر التاريخ”

---

## Microcopy (important for intuition)

Instead of:

* “Select date”

Use:

* “عرض الطلبات لـ”
* “طلبات امبارح”
* “طلبات يوم آخر”

Language matters more than UI here.

---

## One subtle but powerful improvement

When date ≠ Today:

* Change header slightly

Example:

```
Orders        Yesterday · 7 Orders
```

This prevents confusion:

> “ليه مفيش طلبات جديدة؟”

---

## Final recommendation (TL;DR)

**Do this:**

* Make the “Today · X Orders” pill clickable
* Open a bottom sheet
* Offer:

  * Today
  * Yesterday
  * Older → calendar

**Don’t do this:**

* Always-visible calendar
* Date fields
* Complex filters
