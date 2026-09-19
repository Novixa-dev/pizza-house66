# Pizza House Mukalla — Senior Lead QA & Engineering Review

| Field | Value |
|---|---|
| **Product** | Pizza House (بيتزا هاوس) — digital pre-order + kitchen ops |
| **Repo** | `pizza-house66` |
| **Review date** | 2026-09-19 |
| **Reviewer stance** | Team Lead / Senior Full-Stack (defect-first, evidence-based) |
| **Stack** | Next.js 14 App Router, React 18, Prisma + SQLite, Zod, Vitest, Tailwind |
| **Verdict** | **Not ready for production pilot** — strong domain design, but one failing regression and several security/correctness gaps block go-live |

---

## 1. Executive summary

The codebase is a coherent restaurant modular monolith: Arabic-first storefront, scheduled pickup, zero-trust server pricing, Yemeni payment rails, KDS board, and admin ops. Core domain libraries (`pricing`, `scheduler`, `validation`, `auth`) are thoughtfully structured and mostly covered by unit tests.

However, the previous “READY FOR PILOT / PRODUCTION” claim in `docs/FINAL_ENGINEERING_AUDIT.md` is **not current**. As of this review:

- **Automated tests: 26 pass / 1 fail** (suite exit code 1)
- **Production build: passes** (`npm run build` exit 0)
- **Lint: not configured** (`next lint` prompts interactively; no ESLint config shipped)
- **HTTP smoke: all primary routes return 200** with Arabic UI
- **Critical correctness bug:** `COMPLETED → PREPARING` is allowed in the state machine (left in as a mutation-test comment), which the regression suite correctly rejects
- **Security:** order tracking token is serialized to the client; anyone who can open `/track/#PH-xxxx` can cancel that order

**Recommendation:** Fix P0/P1 items below, restore green CI, then re-run a short pilot checklist before any live customer traffic.

---

## 2. Evidence collected

| Activity | Result |
|---|---|
| `npx prisma db push` | OK — schema in sync (`DATABASE_URL=file:./dev.db`) |
| `npm test` (Vitest 5) | **FAIL** — 1 failed, 26 passed (6 files) |
| `npm run build` | **PASS** — 12 routes compiled |
| `npm run lint` | **FAIL / incomplete** — ESLint not initialized |
| HTTP smoke (`localhost:3000`) | `/`, `/menu`, `/checkout`, `/track`, `/kitchen`, `/admin` → **200** |
| Static review | Schema, server actions, auth, scheduler, tracking, checkout, admin/kitchen UIs |
| Prior audit cross-check | `FINAL_ENGINEERING_AUDIT.md` claims 23/23 green and production-ready — **stale / incorrect** |

### Failing test (reproduced)

```
FAIL  tests/stateMachine.test.ts > Order State Machine > strictly blocks illegal backwards or invalid transitions
AssertionError: expected true to be false
  // COMPLETED -> PREPARING is illegal
  expect(res1.isValid).toBe(false);
```

Root cause in source:

```55:58:src/lib/stateMachine.ts
  COMPLETED: {
    allowedNextStates: ["PREPARING"], // MUTATION TEST: Should fail tests/stateMachine.test.ts
    allowedRoles: ["ADMIN"],
```

This is not a flaky test — production transition rules currently allow reopening a completed order into baking.

---

## 3. Findings (severity-ordered)

### [P0] Illegal `COMPLETED → PREPARING` transition allowed — `src/lib/stateMachine.ts`

Terminal order status is not terminal. An authenticated ADMIN session can reopen completed tickets into `PREPARING`, corrupting kitchen metrics, inventory assumptions, and customer tracking UX.

**Fix:** Set `allowedNextStates: []` for `COMPLETED` (and keep `CANCELLED` / `REJECTED` terminal). Re-run `npm test` until green.

---

### [P1] Tracking token leaked to browser; cancel is forgeable via order number — `src/app/track/[id]/page.tsx`, `TrackingClientView.tsx`

1. Tracking page resolves orders by `id` / `orderNumber` / `trackingToken` with **no** requirement that `?token=` matches.
2. Full order (including `trackingToken`) is passed to the client component.
3. Cancel calls `cancelCustomerOrderAction(order.id, order.trackingToken)` using that leaked token.

**Impact:** Knowing or guessing `#PH-1024` is enough to view details and cancel a pre-prep order. Phone masking alone does not mitigate this.

**Fix direction:**
- Do not serialize `trackingToken` to the client.
- Require `searchParams.token === order.trackingToken` for cancel (and optionally for full detail view).
- Pass token only from the post-checkout redirect URL / customer-held link, not from public order-number lookup.

---

### [P1] Slot capacity enforced only in UI, not on create — `src/app/actions/orderActions.ts` vs `checkout/page.tsx`

Checkout computes `existingSlotOrdersCount` and marks full slots unavailable. `createOrderAction` never re-checks capacity or business hours. A crafted server-action payload can book a full or closed slot.

**Fix:** Recompute capacity + hours inside `createOrderAction` before insert (same rules as `generatePickupSlots`).

---

### [P1] Hardcoded weak staff secrets — `src/lib/auth.ts`, `.env.example`

Defaults:

- `SESSION_SECRET = "pizza-house-mukalla-secret-key-2026"`
- `ADMIN_PIN = "1024"`, `KITCHEN_PIN = "2048"`, `CASHIER_PIN = "4096"`

Documented in README/audit as production defaults. HMAC sessions and PIN gates are meaningless if secrets ship unchanged.

**Fix:** Fail boot in production when `SESSION_SECRET` / PINs are missing or equal to known defaults; rotate before any public deploy.

---

### [P2] Receipt uploads are world-readable and not gitignored — `saveReceiptImage`, `.gitignore`

Receipts land under `public/uploads/receipts/` (static public assets). `.gitignore` ignores `.env` and Prisma DBs but **not** `public/uploads/`. Empty today, but any uploaded voucher becomes a guessable/listable URL pattern and may be committed accidentally.

Also: client caps file size at 5MB; Zod allows up to ~8MB string; `saveReceiptImage` has **no** decoded buffer size check.

**Fix:** Store outside `public/` (or signed private route), add size/MIME checks server-side, ignore uploads in git.

---

### [P2] Midnight / overnight pickup date bug — `createOrderAction`

Scheduled pickup builds `requestedPickupTime` from **today’s calendar date** + `HH:mm`. Overnight slots (e.g. `00:00` after a 16:00–00:30 shift) can be stored as earlier-today (already past) instead of tomorrow.

**Fix:** If slot time is before “now” (or before shift open), advance the date by one day when the shift crosses midnight.

---

### [P2] Customer cancel bypasses state machine role matrix — `cancelCustomerOrderAction`

Cancel uses ad-hoc status checks instead of `validateOrderTransition(..., "CUSTOMER")`. The transition map does not list `CUSTOMER` on `QUEUED`/`CONFIRMED` cancel paths, so docs/code disagree. Behavior may be intentional, but it is not centrally governed.

**Fix:** Add explicit `CUSTOMER` cancel edges to the map and call `validateOrderTransition`.

---

### [P2] In-memory PIN rate limit — `src/lib/auth.ts`

`loginAttempts` is a process-local `Map`. On multi-instance / serverless hosts, lockouts do not share state; attackers can rotate instances. Acceptable for a single Node process on LAN; not for scaled hosting without Redis/DB.

---

### [P2] No ESLint config / no CI gate

`npm run lint` does not run non-interactively. No evidence of GitHub Actions / pre-commit enforcing `test` + `build`. Prior audit’s “23 tests on every run” is aspirational without CI.

---

### [P3] Admin loads entire order history — `src/app/admin/page.tsx`

`findMany` with no date window/pagination. Fine for pilot volume; will degrade under sustained traffic.

---

### [P3] Widespread `any` in client views

`AdminClientView`, `KitchenClientView`, `CheckoutClientView`, `TrackingClientView`, `HomeClientView` use `any` props. Build still typechecks via loose boundaries; maintainability and refactor safety suffer.

---

### [P3] Docs vs reality drift

| Claim | Reality |
|---|---|
| Playwright E2E in `docs/TESTING.md` | No Playwright dependency or e2e specs in repo |
| Final audit: 23/23 tests pass | 27 tests, **1 failing** |
| Final audit: production ready | Blocked by P0/P1 above |
| “Complete E2E browser verified” (README) | Not reproducible as automated suite |

---

## 4. What works well (keep)

These are solid for a Mukalla pilot once blockers are fixed:

| Area | Assessment |
|---|---|
| **Zero-trust pricing** | Server recalculates base + option deltas; rejects unavailable products/options |
| **Yemeni phone normalization** | Accepts `07…`, `+967…`, `00967…`; normalizes to 9 digits — tests pass |
| **Scheduler math** | ASAP + release-time formulas and capacity UI logic covered by unit tests |
| **Staff auth pattern** | HMAC-signed httpOnly cookies, constant-time PIN compare, role-gated server actions |
| **RBAC on mutations** | Status, pause, 86ing, payment verify require authenticated roles |
| **Order number collision fallback** | Count-based `#PH-n` with salted fallback (still not transactional-unique; OK for single-node SQLite) |
| **Route smoke** | Customer + staff shells render Arabic content over HTTP 200 |
| **Production build** | Clean compile |

---

## 5. Route / UX smoke matrix

| Route | HTTP | Auth gate | Notes |
|---|---|---|---|
| `/` | 200 | Public | Hero + featured; stock Unsplash image (not brand photo) |
| `/menu` | 200 | Public | Categories + customizer path present |
| `/checkout` | 200 | Public | Empty-cart state when no client cart |
| `/track` | 200 | Public | Search entry |
| `/track/[id]` | (dynamic) | Public | Lookup by order number; token unused for auth |
| `/kitchen` | 200 | PIN modal | StaffAuthModal for KITCHEN/ADMIN |
| `/admin` | 200 | PIN modal | StaffAuthModal for ADMIN only |

Staff pages correctly withhold operational data until PIN unlock (SSR gate). That part of the prior security work holds.

---

## 6. Architecture & ops notes

- **SQLite** is appropriate for a single-branch pilot on one machine; not for multi-region HA. Document backup/restore before pilot nights.
- **No Next.js middleware** — protection is page-level + action-level. Sufficient if every mutating action stays guarded (currently true for staff mutations).
- **KDS / track polling** via `router.refresh()` (10–15s) is simple and fine at low volume; WebSockets not required for MVP.
- **Payment model** (cash + manual transfer verification) matches local rails; residual fraud risk is operational (cashier review), which is acceptable if cashiers are trained.

---

## 7. Test health snapshot

| Suite | Status |
|---|---|
| `tests/scheduler.test.ts` | Pass |
| `tests/validation.test.ts` | Pass |
| `tests/pricing.test.ts` | Pass (needs seeded DB) |
| `tests/auth.test.ts` | Pass |
| `tests/security.test.ts` | Pass |
| `tests/stateMachine.test.ts` | **1 fail** (`COMPLETED → PREPARING`) |

**Coverage gaps (high value next):**

1. Integration test: `createOrderAction` rejects over-capacity slots  
2. Integration test: cancel without valid token fails  
3. Unit: overnight slot date assignment  
4. Server-side receipt size/MIME rejection  
5. Real Playwright happy path (docs already describe it; implement or delete the claim)

---

## 8. Recommended fix order (before pilot)

1. **Restore terminal `COMPLETED` state** → green `npm test`
2. **Stop leaking `trackingToken`; bind cancel to `?token=`**
3. **Server-side slot capacity + hours validation on create**
4. **Require strong `SESSION_SECRET` + non-default PINs in production**
5. **Private receipt storage + size limits + gitignore**
6. **Fix overnight slot date handling**
7. **Add ESLint config + CI job: `test` + `build`**
8. Update/retire `FINAL_ENGINEERING_AUDIT.md` so it cannot be used as a ship gate

---

## 9. Final ship gate

| Gate | Status |
|---|---|
| Automated unit tests green | ❌ |
| Production build | ✅ |
| Lint/CI | ❌ |
| Auth on staff mutations | ✅ |
| Order cancel / track privacy | ❌ |
| Capacity integrity server-side | ❌ |
| Secrets hygiene for production | ❌ |
| Owner-confirmed payment accounts / PINs | ⚠ pending (see `OWNER_INPUT_REQUIRED.md`) |

### Verdict

**Conditional hold — do not pilot live customer orders until P0 and P1 items are fixed and the Vitest suite is green.**

The product direction, domain modeling, and much of the security hardening are above typical prototype quality. Treat this as a **near-pilot codebase with known release blockers**, not as production-certified software. The previous “ruthless final audit” overstated readiness; this report should be the current go/no-go reference.

---

*Generated from static code review, Vitest execution, Next.js production build, and HTTP smoke of primary routes on 2026-09-19.*
