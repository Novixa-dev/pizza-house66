# Quality Assurance & Testing Strategy

## 1. Testing Pyramid

```text
       ▲
      / \     E2E Tests (Playwright)
     /   \    - Full Customer Order to Kitchen Flow
    /─────\   Integration Tests (Next.js Server Actions + DB)
   /       \  - Pricing integrity, receipt validation, order transitions
  /─────────\ Unit Tests (Vitest)
 /           \- Time slot generator, release calculations, formatters
└─────────────┘
```

---

## 2. Unit Testing Suite

Targeting core domain logic:
1. **Pricing Recalculation Engine**:
   - Computes correct item total with single options (e.g. Medium size).
   - Computes correct item total with multiple add-ons (Stuffed crust + extra cheese + olives).
   - Verifies server overrides manipulated payload prices.
2. **Scheduling Calculator**:
   - Correctly rounds earliest ASAP time to 15-minute slot.
   - Calculates exact kitchen release time: $\text{Requested} - (\text{Prep} + \text{Buffer})$.
   - Correctly marks slots as unavailable if outside operating hours or capacity limit reached.

---

## 3. Playwright End-to-End User Journey

Automated browser scenario testing:
1. **Customer**:
   - Opens homepage in Arabic (RTL).
   - Opens Pepperoni Pizza, selects Large + Stuffed Crust + Extra Mozzarella.
   - Adds to cart, verifies drawer subtotal.
   - Fills guest name & Yemeni phone number.
   - Chooses scheduled pickup time.
   - Selects Bank Transfer, attaches mock receipt, and submits.
2. **Cashier**:
   - Navigates to `/admin/payments`, inspects pending order.
   - Approves receipt. Order status changes to `CONFIRMED`.
3. **Kitchen**:
   - Navigates to `/kitchen`, verifies order appears in `Upcoming` / `Ready to Prepare`.
   - Clicks `Start Baking` $\to$ status moves to `PREPARING`.
   - Clicks `Mark Ready` $\to$ status moves to `READY`.
4. **Customer Verification**:
   - Checks `/track/[id]` and verifies status reads "Ready for Pickup".
