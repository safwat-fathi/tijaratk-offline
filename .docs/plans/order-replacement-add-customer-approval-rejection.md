# Order Replacement - Add Customer Approval/Rejection

## Summary
Implement item-level replacement approval/rejection by customer from tracking page, plus full-order rejection by customer.

## Scope
- Backend: schema, enums, DTOs, endpoints, service logic, WhatsApp templates/notifications.
- Frontend: order status/type updates, API service methods, tracking UI actions for customer decisions.

## Decisions
- Status window: draft + confirmed only.
- Full-order customer reject uses `rejected_by_customer` status.
- Replacement model: pending proposal then approved promotion.
- Optional reject reason.
- Notifications enabled both directions using:
  - `TWILIO_CONTENT_SID_ORDER_PRODUCT_REPLACEMENT`
  - `TWILIO_CONTENT_SID_MERCHANT_REPLACEMENT_ACCEPTED`
  - `TWILIO_CONTENT_SID_MERCHANT_REPLACEMENT_REJECTED`

## Verification
- Run backend/frontend lint commands and targeted type checks if available.
