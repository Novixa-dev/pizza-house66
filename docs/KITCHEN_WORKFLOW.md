# Kitchen Display System (KDS) Workflow

## 1. Kitchen Screen Architecture

The kitchen interface is optimized for high-temperature, fast-paced commercial kitchen environments:
- **Tablet / Large Display Native**: Touch-friendly cards with minimum 48px touch targets.
- **Dark High-Contrast Theme**: Minimizes eye fatigue under fluorescent kitchen lighting.
- **Glanceable Color Coding**:
  - Gray header: Scheduled Upcoming
  - Amber border / pulsing tag: Ready to Bake (immediate action needed)
  - Orange tag: In Oven (actively baking)
  - Green tag: Ready for Pickup (boxed on warm shelf)

---

## 2. Kitchen Display Board Columns

```text
┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│ 1. Upcoming     │ 2. Ready to     │ 3. In Oven      │ 4. Ready for    │
│    (Scheduled)  │    Bake         │    (Preparing)  │    Pickup       │
├─────────────────┼─────────────────┼─────────────────┼─────────────────┤
│ #PH-1028        │ #PH-1024        │ #PH-1022        │ #PH-1020        │
│ Pickup: 8:30 PM │ Pickup: 8:00 PM │ Pickup: 7:50 PM │ Pickup: 7:40 PM │
│ Releases 8:10 PM│ Release: NOW!   │ In oven: 8 min  │ Waiting 4 min   │
│ 1x Pepperoni L  │ 2x Margherita M │ 1x Ranch Chk L  │ 1x Supreme L    │
│                 │ [Start Baking]  │ [Mark Ready]    │ [Handed Over]   │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┘
```

---

## 3. Ticket Card Details

Each card displays:
1. **Order Header**: `#PH-1024` • Customer Name (`أحمد ب.`) • Target Pickup (`8:00 PM`).
2. **Items List**:
   - `1x بيتزا ببروني (كبير - أطراف محشوة)`
   - `+ جبنة إضافية (Extra Cheese)`
   - `1x بطاطس ودجز`
3. **Special Notes Callout**: Red highlight if customer requested custom alterations (e.g. `ملاحظة: بدون فلفل حار`).
4. **Primary Action**:
   - `Ready to Bake` column: Single tap on `ابدأ التحضير (Start Baking)` updates state to `PREPARING` and stamps `actualPrepStartTime`.
   - `Preparing` column: Single tap on `جاهز للاستلام (Mark Ready)` moves ticket to `READY` and stamps `readyTime`.
