# Feature Specification & Functional Requirements

## 1. Customer-Facing Web Experience

### 1.1 Brand Homepage & Discovery
- **Hero Section**: High-resolution imagery, Pizza House Mukalla value proposition ("طعم البيتزا الحقيقي في المكلا"), direct CTA buttons (`اطلب الآن / Order Now`, `استكشف القائمة / View Menu`).
- **Verified Badges**: Address landmark (فوه - حي المساكن - بالقرب من جامعة الأحقاف ومستوصف النور), telephone numbers (`05375561`, `772207788`), and live status badge (`مفتوح الآن / مغلق حالياً`).
- **Featured Categories & Best Sellers**: Quick filter pills (بيتزا, فطائر, مقبلات, مشروبات).
- **Customer Reviews & Social Feed**: Highlights from social presence and real customer feedback.

### 1.2 Digital Menu & Live Catalog
- **Category Tabs**: Sticky navigation bar allowing smooth scrolling or switching across categories.
- **Search & Filter**: Real-time client-side filter by dish name or ingredient.
- **Product Card**: High-contrast photography, title (AR/EN), concise description, base price in YER, availability badge.

### 1.3 Product Customizer Engine
- **Size Selector**: Radio cards (Small, Medium, Large) showing price delta.
- **Crust Type Selector**: Classic Pan, Thin Crispy, Stuffed Cheese Crust (+ price delta).
- **Extra Toppings**: Multi-select checkboxes with visual counter and price increments.
- **Special Instructions**: Freeform text input for preparation notes (e.g. "بدون بصل", "تحمير زيادة").
- **Dynamic Price Footer**: Updates live as options are toggled.

### 1.4 Cart Drawer & Checkout
- **Cart Management**: Quantity increment/decrement, option itemization, item deletion, subtotal calculation.
- **Guest Checkout Form**:
  - Customer Name (Required).
  - Mobile Phone Number (Required, Yemeni format validation: 9 digits starting with 7, e.g. 772207788).
  - Optional Notes.
- **Pickup Scheduling Selector**:
  - `ASAP (أسرع وقت ممكن)`: Displays calculated earliest time.
  - `Scheduled (تحديد موعد مسبق)`: Date & 15-minute slot selector.
- **Payment Method Selector**:
  - `Pay at Pickup (الدفع عند الاستلام)`: Cash or local POS terminal card.
  - `Bank / Exchange Transfer (تحويل بنكي / صرافة)`: Displays merchant account details for Kuraimi, Al-Amqi, and Al-Busairi.
- **Receipt Upload Component**:
  - File picker accepting JPEG, PNG, WEBP (max 5MB).
  - Live client preview of receipt image before submission.
  - Reference number text input.
- **Order Confirmation & Tracking Screen**:
  - Order code (e.g. `#PH-1024`).
  - Progress tracker (Received $\to$ Verified $\to$ Queued $\to$ Preparing $\to$ Ready $\to$ Completed).
  - WhatsApp quick-help button with pre-filled message ("مرحباً بيتزا هاوس، بخصوص طلبي رقم #PH-1024").

---

## 2. Kitchen Operations (KDS)

- **Dedicated Route**: `/kitchen` with auto-refresh / real-time updates.
- **High-Visibility Cards**: Large typography, order number, elapsed timer, item list with selected options highlighted in amber/red.
- **Action Buttons**: Single-tap "ابدأ التحضير (Start Baking)", "جاهز للتسليم (Mark Ready)".
- **Audio Notification**: Web Audio chime when a new scheduled order becomes active.

---

## 3. Restaurant Administration & Management

- **Overview Dashboard**: Today's orders, revenue, pending transfer count, active prep count.
- **Orders Table**: Search by reference, customer name, phone; filter by status and date.
- **Payment Verification Center**: Detailed receipt inspection modal with zoom, reference verification, and one-click Approve/Reject.
- **Menu Management**: Add/Edit products, adjust prices, toggle Sold Out/Available status.
- **Operational Controls**: "Pause Online Orders" toggle with custom alert banner editor.
