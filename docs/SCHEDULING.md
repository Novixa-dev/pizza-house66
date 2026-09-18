# Scheduling Engine: Pickup Slots & Kitchen Release

## 1. The Core Scheduling Formula

The system is fundamentally distinguished by separating **Customer Order Time** from **Kitchen Preparation Time**.

$$\begin{aligned}
T_{\text{created}} &= \text{Timestamp when customer submits order} \\
T_{\text{requested}} &= \text{Customer selected pickup time} \\
D_{\text{prep}} &= \text{Estimated preparation duration (e.g. 15–20 minutes)} \\
B_{\text{buffer}} &= \text{Kitchen safety buffer (e.g. 5 minutes)} \\
T_{\text{release}} &= T_{\text{requested}} - (D_{\text{prep}} + B_{\text{buffer}})
\end{aligned}$$

---

## 2. Slot Generation Algorithm

```typescript
export interface TimeSlot {
  timeString: string;       // e.g. "19:45"
  displayLabelAr: string;   // e.g. "07:45 مساءً"
  displayLabelEn: string;   // e.g. "07:45 PM"
  isAvailable: boolean;     // False if capacity exceeded or closed
  remainingCapacity: number;// Current slots left
}
```

### Steps:
1. Fetch active shift hours for today's day of week from `BusinessHour`.
2. Determine earliest valid pickup time:
   $$T_{\text{earliest}} = \text{now}() + D_{\text{prep}} + B_{\text{buffer}}$$
   Round up to nearest 15-minute mark.
3. Step through operating hours in 15-minute increments until 30 minutes before shift closing.
4. For each slot, count existing confirmed/queued orders in `Order` where `requestedPickupTime == slotTime`.
5. If count $\ge$ `slotCapacityMax` (default: 8), mark `isAvailable = false`.
6. Return formatted slot array for customer selector.

---

## 3. Real-Time Release Worker / Trigger

In Next.js, orders are continuously evaluated:
- When the Kitchen Display System renders or polls via Server Action:
  ```sql
  SELECT * FROM Order 
  WHERE status = 'QUEUED' 
    AND plannedPrepStartTime <= CURRENT_TIMESTAMP;
  ```
- Any matching orders are automatically updated to `READY_TO_PREPARE`.
- The KDS rings an audio chime and presents the ticket to the cooks.
