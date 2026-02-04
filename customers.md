Great question — the **Customers page** is one of those “silent power” pages. Merchants won’t ask for it explicitly, but once it’s good, they *depend* on it.

I’ll answer as a **product manager guiding a UI/UX designer**, with **mobile-first**, **Egyptian merchant reality**, and **bootstrapped SaaS constraints** in mind.

Everything below is aligned with the WhatsApp-first, operations-driven philosophy described in the reference doc .

---

## 1. What is the Customers Page really for? (PM clarity for designer)

**This page is NOT a CRM.**
It exists to help the merchant answer 5 daily questions *fast*:

1. مين الزبون اللي بيطلب كتير؟
2. ده زبون قديم ولا جديد؟
3. أكلمه إزاي دلوقتي؟
4. آخر مرة طلب كان إمتى؟
5. أقدر أكرر له آخر طلب بسهولة؟

If the design doesn’t help answer these in **under 3 seconds**, it’s too heavy.

---

## 2. Must-Have Features (MVP scope only)

### 2.1 Customer List (Auto-Generated)

**Data shown per customer (strict minimum):**

* Customer name (or phone if name missing)
* Phone number
* Total orders count
* Last order date
* Total spent (optional but very powerful)

👉 No manual customer creation.
👉 Customers appear **only after first order**.

---

### 2.2 Tap-to-Action (Most Important UX rule)

Every customer row must allow **one-tap actions**:

Primary actions:

* 📞 Call customer
* 💬 WhatsApp customer

Secondary (behind tap):

* View order history
* Repeat last order (if enabled later)

**No buttons. No clutter.**
Use **row tap + swipe actions** (mobile-native behavior).

---

### 2.3 Customer Detail (Bottom Sheet, not a new page)

When merchant taps a customer:

Open a **bottom sheet** (60–70% screen height):

**Top section**

* Name
* Phone (with Call / WhatsApp icons)

**Stats row (icons + numbers)**

* Orders count
* Last order date
* Avg order value (optional)

**Order history (last 3–5 orders only)**

* Date
* Total
* Status

👉 Do NOT show full history by default (performance + simplicity).

---

### 2.4 Smart Labels (Zero configuration)

Auto-generated tags (read-only):

* 🟢 “Frequent” (e.g. 5+ orders)
* 🟡 “New” (first order < 7 days)
* 🔴 “Inactive” (no order 30+ days)

These labels help merchants *feel* insights without charts.

---

## 3. Mobile-First Layout Guidance (Very important)

### 3.1 Page Structure (Top → Bottom)

**1️⃣ Header**

* Title: “Customers”
* Subtext (small): “Auto-created from orders”

**2️⃣ Search bar (sticky)**

* Placeholder: “Search by name or phone”
* Must support numeric keypad (phone search is common)

**3️⃣ Customer list**
Each row:

```
[Avatar]  Ahmed Hassan
           0123****89
           12 orders · Last: 2 days ago
```

Right side:

* WhatsApp icon
* Call icon

**4️⃣ Empty state**
When no customers:

> “Your customers will appear here after first order”

---

### 3.2 Row Height & Touch Targets

* Minimum row height: **72px**
* Icons: **44x44px touch area**
* Spacing > beauty (shop hands, fast taps)

---

## 4. Sorting & Filtering (Simple, merchant-friendly)

Default sorting:

* **Last order date (recent first)**

Optional quick filters (chips, not dropdowns):

* All
* Frequent
* New
* Inactive

👉 Chips scroll horizontally (mobile friendly).

---

## 5. What NOT to include (Very important for designer)

🚫 No:

* Email
* Addresses (belongs to orders, not customers)
* Notes (later feature)
* Funnels, charts, segments
* Edit customer info
* Marketing language

This page is **operational**, not analytical.

---

## 6. Performance & Cost Awareness (Bootstrapped reality)

* Load max **20–30 customers per page**
* Infinite scroll, not pagination UI
* Cache aggressively
* No heavy avatars (use initials)

This keeps:

* Backend cheap
* Mobile fast
* UX smooth on low-end phones

---

## 7. Visual Tone & Language

* Friendly, Arabic-first labels
* Neutral colors
* Avoid “CRM” vibes
* Feels like WhatsApp contacts, not software

If the merchant thinks:

> “دي شبه contacts بس أذكى شوية”

You won.

---

## 8. Success Criteria (for designer)

The Customers page is successful if:

* Merchant finds a customer in **< 2 seconds**
* Merchant contacts customer in **1 tap**
* Merchant understands who matters **without thinking**

---

## 9. Future-Ready (but invisible for now)

Design should *allow later* (without showing now):

* Reorder button
* Customer notes
* Broadcast tagging
* Credit / debt tracking

But **do not surface placeholders** yet.