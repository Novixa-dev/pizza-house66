# User Flows & Operational Journeys

## 1. Customer Ordering Journey

```mermaid
sequenceDiagram
    autonumber
    actor Customer
    participant App as Web App (RTL/LTR)
    participant Server as Next.js Server
    participant DB as Database
    actor Cashier
    actor Kitchen

    Customer->>App: Opens Menu & selects Pizza
    Customer->>App: Customizes Size (Large), Crust (Stuffed), Extra Cheese
    Customer->>App: Adds to Cart & Proceeds to Checkout
    Customer->>App: Selects Scheduled Pickup (e.g. 8:00 PM)
    Customer->>App: Selects Payment: Bank Transfer (Kuraimi) & uploads receipt
    Customer->>Server: Submits Order Payload
    Server->>Server: Recalculates Authoritative Totals & Validates Pickup Slot
    Server->>DB: Creates Order (#PH-1024, Status: PAYMENT_PENDING)
    Server-->>Customer: Order Confirmation + Live Tracking URL

    Cashier->>App: Receives payment notification
    Cashier->>App: Reviews uploaded receipt & reference number
    Cashier->>Server: Approves Payment
    Server->>DB: Updates Payment (VERIFIED), Order (CONFIRMED -> QUEUED)
    App-->>Customer: Status changes to "Confirmed & Scheduled for 8:00 PM"

    Note over Server,Kitchen: System monitors current time vs plannedPrepStartTime (7:40 PM)
    Server->>DB: At 7:40 PM, transitions Order to READY_TO_PREPARE
    Server-->>Kitchen: Audio chime on KDS + Ticket moves to "Active Preparation"
    Kitchen->>Server: Clicks "Start Baking" -> Order Status: PREPARING
    App-->>Customer: Status changes to "In the Oven / جاري التحضير"

    Kitchen->>Server: Clicks "Mark Ready" -> Order Status: READY
    Server->>DB: Records readyTime
    App-->>Customer: Status changes to "Ready for Pickup! / جاهز للاستلام"

    Customer->>Cashier: Arrives at 8:00 PM & shows #PH-1024
    Cashier->>Server: Clicks "Complete" -> Order Status: COMPLETED
    Server->>DB: Records completedTime
```

---

## 2. Cashier Operations Journey (Payment Verification & Handover)

1. **Review Pending Transfers**:
   - Cashier navigates to `/admin/payments`.
   - List displays pending transfer orders with customer name, phone, amount in YER, reference number, and receipt thumbnail.
   - Cashier clicks thumbnail to open full-resolution receipt preview modal.
   - Cashier checks their merchant terminal/SMS alert:
     - **Match**: Cashier clicks `Approve Payment`. Order transitions to `CONFIRMED`.
     - **Mismatch / Fake**: Cashier clicks `Reject Payment`, enters a clear reason (e.g. "المبلغ غير مطابق" or "الرقم المرجعي غير موجود"). Order transitions to `REJECTED`, notifying customer on tracking screen.

2. **Customer Pickup Counter**:
   - Customer arrives and announces order reference (e.g. `#PH-1024`).
   - Cashier views `/admin/orders` or `/kitchen`.
   - If payment method was `PAY_AT_PICKUP`, cashier collects cash/card, marks paid, and clicks `Complete Order`.

---

## 3. Kitchen Operations Journey (KDS)

- Kitchen operates a wall-mounted tablet or large touch-screen at `/kitchen`.
- The screen has 4 high-contrast operational columns:
  1. **Scheduled / Upcoming**: Future orders awaiting their preparation window.
  2. **Ready to Prepare (الطلبات الجاهزة للبدء)**: Orders whose planned preparation start time has arrived. Displayed with a bold amber border and timer.
  3. **Preparing (قيد التحضير)**: Orders currently in the dough rolling, topping, or baking phase.
  4. **Ready for Pickup (جاهز للتسليم)**: Boxed orders waiting on the heated counter for customer pickup.
- Every state transition is executed with a single touch target.
