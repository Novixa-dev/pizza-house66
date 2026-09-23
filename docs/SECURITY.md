# Security Architecture & Current Status

> **Status legend:** ✅ implemented in code · ⚠️ partially implemented · ❌ **specified only — NOT implemented**
>
> This document was rewritten on 2026-09-22 after a code audit. The previous version described
> every control below in the present tense as though it were built. Most were not. Read the status
> column, not the intent.

## 1. Control status (audited against `src/` on 2026-09-22)

| Control | Status | Reality in code |
| :--- | :--- | :--- |
| Server-side price recalculation | ✅ | `src/lib/pricing.ts` re-reads product and option prices from the DB and ignores all client price fields. Genuinely sound. |
| SQL injection defence | ✅ | Prisma parameterised queries throughout; no raw SQL. |
| XSS | ⚠️ | React auto-escaping only. **No Content-Security-Policy is set** — `next.config.mjs` defines no security headers. |
| Staff authentication | ❌ | **There is no authentication anywhere in the project.** No `User` model, no session, no password hashing, no login page, no `middleware.ts`. |
| Role-based access control | ❌ | No roles exist. `/admin` and `/kitchen` are public, unauthenticated routes serving every customer's name, phone, order and payment data to anyone who visits the URL. |
| Server Action authorization | ❌ | `updateOrderStatusAction`, `verifyPaymentAction`, `togglePauseOrderingAction` and `toggleProductAvailabilityAction` perform no caller check. Any visitor can approve a payment, mark an order complete, pause the restaurant, or mark items sold out. |
| IDOR protection on order tracking | ❌ | `Order.trackingToken` exists in the schema and `/track/[id]` accepts a `?token=` search param, **but the token is never compared to anything**. The page looks the order up by `id` alone. Order IDs are cuids, so this is obscurity, not authorization. |
| Order state machine | ❌ | `updateOrderStatusAction` writes whatever status string it is given. No transition table, no validation of legal transitions, no permission check. The "state machine safeguards" comment in the code is inaccurate. |
| Receipt upload validation | ❌ | The client reads the file with `FileReader` into a base64 string and posts it as `receiptUrl`; the server stores it verbatim. **No MIME check, no size limit, no extension allowlist, no filename sanitisation.** `PaymentReceipt.fileName`/`mimeType`/`fileSize` are hardcoded to `"receipt.jpg"` / `"image/jpeg"` / `102400` and are therefore meaningless. |
| Receipt access control | ❌ | Receipts are rendered to anyone who opens `/admin`. There is no authenticated streaming endpoint. |
| Duplicate order prevention / idempotency | ❌ | No idempotency key. Double-submitting checkout creates two orders. |
| Order number uniqueness | ❌ | `#PH-${1024 + await prisma.order.count()}` runs **outside** the creation transaction. Two concurrent orders compute the same number and one fails on the unique constraint. |
| Capacity enforcement | ⚠️ | Slot capacity is computed for **display** in `src/app/checkout/page.tsx`, but `createOrderAction` never re-checks it. A crafted request books a full slot. |
| Business-hours enforcement | ❌ | `createOrderAction` accepts any future `HH:mm` for a scheduled pickup without checking business hours, closures, or the 30-minute cut-off that the slot generator applies for display. |
| Rate limiting | ❌ | Not present. |
| Audit logging | ⚠️ | `AuditLog` rows are written, but `actor` is a client-supplied or defaulted string (`"staff"`, `"الكاشير"`, the customer's typed name). With no authentication it does not establish who did anything. |

## 2. Secrets

`.env.example` ships `SESSION_SECRET="pizza-house-mukalla-secret-key-2026"` and `ADMIN_PIN="1024"`.
Neither variable is read anywhere in the codebase. They must either be wired to a real
authentication implementation or removed; a committed placeholder secret invites reuse in production.

## 3. Required before any real deployment

These are blocking. The platform handles customer phone numbers and payment evidence.

1. Authentication for staff (`User` model, password hashing, session cookie, login route).
2. RBAC with `OWNER` / `MANAGER` / `CASHIER` / `KITCHEN` roles, enforced in every mutating Server Action — not in the UI.
3. `middleware.ts` gating `/admin` and `/kitchen`.
4. Token-verified order tracking: compare `?token=` against `Order.trackingToken` in constant time, or move tracking behind a phone-number challenge.
5. A real upload handler: size cap, MIME sniffing, generated filename, storage outside `public/`, authenticated streaming route.
6. Order state machine with an explicit legal-transition table plus per-role permission.
7. Idempotency key on checkout; order number generated inside the transaction.
8. Server-side revalidation of business hours and slot capacity at order creation.
9. Security headers (CSP, `X-Content-Type-Options`, `Referrer-Policy`) in `next.config.mjs`.
10. Rate limiting on order creation and any future login route.
