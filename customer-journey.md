Great question — this is *exactly* the right moment to lock this down, because **notification philosophy** will either make Tijaratk feel professional… or annoying real fast.

I’ll answer in two parts:

1. **Clear end-to-end customer journey (latest model)**
2. **WhatsApp notifications: when to notify, when NOT to**

I’ll be opinionated and grounded in **Egyptian customer behavior + bootstrapped cost reality**.

---

## 1️⃣ Customer Journey (Latest, Clean Version)

### 🧍‍♂️ Phase 1: Discovery & Entry

**Trigger:** Customer wants to order from a nearby store.

**What happens:**

* Customer receives **WhatsApp message** from merchant:

  > “اطلب من عندنا من هنا 👇”
* Message contains **order link** (or QR → link).

**Key principles:**

* No app
* No login
* No friction
* WhatsApp feels “normal” for Egyptians

✅ **WhatsApp message here is essential** (this is the entry point)

---

### 📱 Phase 2: Ordering (Customer Order Page)

**Customer actions:**

* Opens mobile-friendly order page
* Sees:

  * Simple product list **OR**
  * Free-text input (if no catalog)
* Selects quantities / writes notes
* Enters:

  * Name
  * Phone
  * Address / landmark
* Confirms order (Cash on delivery)

**System behavior:**

* Order is created
* Status = `New`

🚫 **NO WhatsApp message yet**
Why?

* Customer *just* did the action
* Screen confirmation is enough
* Avoid spam

---

### 🛎 Phase 3: Order Submitted → Seller Action

**What the seller gets:**

* **Instant WhatsApp notification**

  > “طلب جديد من أحمد – 120 جنيه – الدقي”

This is **non-negotiable**.

Why?

* Sellers live on WhatsApp
* This replaces chaos
* This is the “aha moment” of the product

✅ **WhatsApp message: YES (seller only)**

---

### 📬 Phase 4: Order Confirmation (Meaningful Moment #1)

Seller reviews order and taps **Confirm**.

**Now customer gets WhatsApp message:**

> “تم تأكيد طلبك من [اسم المحل]
> تابع حالة الطلب من هنا 👇”

Includes:

* Tracking link
* Order summary (optional)

Why this matters:

* Reduces “هو الطلب اتقبل؟”
* Builds trust
* Sets expectations

✅ **WhatsApp message: YES (customer)**

---

### 🚚 Phase 5: Out for Delivery (Meaningful Moment #2)

Seller marks order as **Out for Delivery**.

Customer receives:

> “طلبك في الطريق 🚚
> المندوب: 01XXXXXXXX”

Why this is powerful:

* Egyptians *expect* this update
* Reduces calls
* Makes small stores feel professional

✅ **WhatsApp message: YES**

---

### ✅ Phase 6: Completed

Order delivered, cash paid.

**Two options (recommended):**

**Option A – No message (default)**

* Silent completion
* Least annoying
* Lowest cost

**Option B – Soft confirmation (optional / later)**

> “شكراً لطلبك من [اسم المحل] 🌿
> تقدر تطلب تاني في أي وقت من هنا”

🚫 Do NOT do this by default in MVP
(It becomes noise very quickly)

---

### ❌ Phase 7: Cancelled (Edge Case)

If seller cancels:

> “نأسف، تم إلغاء طلبك بسبب عدم توفر بعض الأصناف”

✅ **WhatsApp message: YES**
This avoids anger and confusion.

---

## 2️⃣ WhatsApp Notifications: The Golden Rule

### ❌ WRONG approach

> Notify customer on **every** action

This causes:

* Message fatigue
* Blocking the number
* Higher WhatsApp costs
* Zero perceived value

---

### ✅ RIGHT approach (Tijaratk Rule)

> **Notify only on moments that change customer expectations**

### Meaningful Moments Only 👇

| Event                 | WhatsApp?   | Why                |
| --------------------- | ----------- | ------------------ |
| Order link sent       | ✅           | Entry point        |
| Order submitted       | ❌           | User already knows |
| Seller receives order | ✅ (seller)  | Core value         |
| Order confirmed       | ✅           | Trust & clarity    |
| Out for delivery      | ✅           | Reduces calls      |
| Completed             | ❌ (default) | Noise              |
| Cancelled             | ✅           | Critical info      |

---

flowchart TD
    A[Customer receives WhatsApp order link] --> B[Opens Order Page]
    B --> C[Selects products or writes free text]
    C --> D[Enters phone + address]
    D --> E[Submits order]

    E -->|System| F[Order created: NEW]

    F -->|WhatsApp| G[Seller notified: New Order]

    G --> H{Seller decision}

    H -->|Confirm| I[Order CONFIRMED]
    I -->|WhatsApp| J[Customer notified + Tracking Link]

    J --> K[Seller prepares order]

    K -->|Dispatch| L[Order OUT FOR DELIVERY]
    L -->|WhatsApp| M[Customer notified: On the way]

    M --> N[Order DELIVERED]
    N --> O[Order COMPLETED]

    H -->|Cancel| P[Order CANCELLED]
    P -->|WhatsApp| Q[Customer notified: Order cancelled]

### Notification Rules
- WhatsApp is used **only** for meaningful state changes
- No notification on order submission
- Customer is notified on:
  - Order confirmation
  - Out for delivery
  - Cancellation
