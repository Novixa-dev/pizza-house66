# Core Business Rules & Domain Invariants

## 1. Financial & Pricing Rules

1. **Zero Client Trust**: All client-side prices, discounts, subtotal, and tax totals sent via HTTP requests are ignored. The server retrieves active base prices and option price deltas from the database and recalculates everything authoritatively.
2. **Precision & Minor Units**: All monetary values are handled using integers in YER (e.g. 5,500 YER = 5500 integer). Floating-point arithmetic is prohibited.
3. **Price Snapshotting**: When an order is placed, historical item prices, option names, and totals are permanently snapshotted in `OrderItem` and `OrderItemOption`. Future menu price edits do not alter historical orders.

---

## 2. Scheduling & Pickup Rules

1. **Operating Hours Enforced**: Customers cannot select pickup times outside of official working hours or during shifts when the restaurant is closed.
2. **Earliest Pickup Calculation (ASAP)**:
   $$\text{Earliest Pickup} = \text{Current Time} + \text{Prep Duration (e.g. 15 min)} + \text{Kitchen Buffer (e.g. 5 min)}$$
   Rounded up to the nearest 5-minute interval.
3. **Slot Intervals**: Pickup time slots are discretized into 15-minute windows (e.g. 4:15 PM, 4:30 PM, 4:45 PM).
4. **Capacity Limits**: Maximum $N$ orders per 15-minute slot (default: 8 orders). When capacity is reached, the slot is marked `FULL` and disabled.
5. **Kitchen Release Trigger**:
   $$\text{Release Time} = \text{Requested Pickup Time} - \text{Estimated Prep Time}$$
   Orders remain in `QUEUED` until current time $\ge$ Release Time, at which point they become `READY_TO_PREPARE`.

---

## 3. Order Lifecycle & State Invariants

| Transition | Allowed Roles | Pre-conditions |
| :--- | :--- | :--- |
| `PENDING` $\to$ `PAYMENT_PENDING` | Customer / System | Created with Transfer method |
| `PAYMENT_PENDING` $\to$ `CONFIRMED` | Cashier / Manager / Admin | Valid receipt verified |
| `PAYMENT_PENDING` $\to$ `REJECTED` | Cashier / Manager / Admin | Receipt rejected with reason |
| `PENDING` $\to$ `CONFIRMED` | Customer / System | Created with Pay-at-Pickup method |
| `CONFIRMED` $\to$ `QUEUED` | System | Scheduled order waiting for prep window |
| `CONFIRMED` / `QUEUED` $\to$ `PREPARING` | Kitchen / Manager | Kitchen initiates baking |
| `PREPARING` $\to$ `READY` | Kitchen / Manager | Food boxed and placed on warm rack |
| `READY` $\to$ `COMPLETED` | Cashier / Manager | Customer collects food |
| Any active state $\to$ `CANCELLED` | Manager / Admin | Cancellation authorized |

---

## 4. Operational Override Rules

1. **Pause Online Ordering**: When toggled active by Manager/Admin:
   - Public menu remains fully visible and browsable.
   - Checkout submission button is disabled with an informative localized banner (e.g. "نعتذر، تم إيقاف استقبال الطلبات مؤقتاً لضغط المطبخ. يرجى المحاولة لاحقاً").
   - Existing pending/scheduled orders continue through their regular lifecycle.
2. **Item Availability Rules**:
   - `AVAILABLE`: Fully orderable.
   - `SOLD_OUT`: Visible with "نفدت الكمية" badge; cannot be added to cart.
   - `HIDDEN`: Omitted from public menu views entirely.
