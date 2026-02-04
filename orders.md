## Recommended Dashboard Notification Behavior

### 1. When a new order arrives AND dashboard is open

Use **soft, in-context signals**, not system alerts.

### What to do:

* Increment the **New tab badge** instantly
* Subtle highlight animation on the top of the list
* Optional small inline banner:

  > “New order received”

No sound. No modal. No toast storm.

---

### 2. Visual pattern that works very well

**Auto-insert the new order at the top**, with:

* Slight background highlight (2–3 seconds)
* Then fades to normal

This mimics:

> “A new paper just landed on your desk”

Very intuitive.

---

## What NOT to do in dashboard

❌ Browser push notifications (by default)
❌ Loud sounds
❌ Full-page modal
❌ Blocking popups

Why?

* Shop environment is noisy already
* Merchant may be serving a customer
* You don’t want them to panic

---

## Status badge is your strongest signal

Your design already does this well 👍

Enhance it:

* New tab badge increases immediately
* If merchant is on another tab (Confirmed, etc.):

  * Animate the New badge briefly
  * Optional small dot pulse

This pulls attention **without interruption**.

---

## What about when dashboard is NOT open?

### ❌ Dashboard should do nothing

This is WhatsApp’s job.

If you rely on dashboard notifications alone:

* Orders will be missed
* Trust will break
* Merchants will blame the product

So the rule is:

> **WhatsApp = wake me up**
> **Dashboard = keep me oriented**

---

## Edge case: merchant disabled WhatsApp notifications

Still:

* Do NOT escalate dashboard behavior
* You can *suggest* enabling WhatsApp alerts later
* Never compensate with aggressive UI

---

## One smart optional enhancement (later)

If dashboard is open AND merchant is idle:

* Show a **tiny bell icon with dot**
* Clicking it scrolls to the new order

This is optional — don’t ship it early.

---

## Simple decision table

| Situation        | Dashboard action   |
| ---------------- | ------------------ |
| Dashboard open   | Soft visual update |
| Dashboard closed | Nothing            |
| New order        | Badge + highlight  |
| Multiple orders  | Badge count only   |
| Busy UI          | No interruption    |

---

## Product principle to remember

If a merchant ever says:

> “التطبيق قلقني”

You’ve already lost.

Calm > clever.

