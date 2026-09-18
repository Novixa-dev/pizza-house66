# Analytics & Operational Intelligence

## 1. Core Event Tracking Taxonomy

The system captures key operational and conversion telemetry without violating user privacy:

| Event Name | Trigger Stage | Metadata Captured |
| :--- | :--- | :--- |
| `menu_viewed` | Customer opens menu | Category filter, language (ar/en) |
| `product_customized` | Customer opens customizer | Product ID, size chosen, option count |
| `cart_item_added` | Item added to cart | Product ID, total item price YER |
| `checkout_started` | Customer clicks Checkout | Cart subtotal, item count |
| `order_submitted` | Order created | Order ID, pickup mode (ASAP vs Scheduled), payment method |
| `receipt_uploaded` | Receipt file attached | File size, mime type |
| `payment_verified` | Cashier approves slip | Order ID, cashier ID, duration to verify |
| `prep_started` | Cook taps Start Baking | Order ID, planned vs actual prep start difference |
| `order_ready` | Cook taps Ready | Actual baking duration (minutes) |
| `order_completed` | Handed to customer | Total turnaround time, customer wait time |

---

## 2. Operational Metrics & Management KPIs

1. **Wait Time Delta**: Difference between customer arrival time and food ready time.
2. **Scheduled vs ASAP Ratio**: Measures adoption of pre-ordering vs walk-in rush.
3. **Baking Precision**: Percentage of orders where preparation began within $\pm 2$ minutes of planned release time.
4. **Average Order Value (AOV)**: Tracked in Yemeni Rials (YER).
5. **Top Customizations**: Most popular toppings (e.g. Extra Mozzarella, Ranch Sauce) to optimize inventory replenishment.
