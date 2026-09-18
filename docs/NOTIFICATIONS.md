# Notifications & Alerting Strategy

## 1. Multi-Channel Notification Hierarchy

```text
┌─────────────────────────┐       ┌─────────────────────────┐
│     Customer Channels   │       │   Restaurant Channels   │
│ - Live Web Tracking UI  │       │ - Kitchen Audio Chime   │
│ - Browser Push (PWA)    │       │ - Admin Dashboard Badge │
│ - WhatsApp Click/Direct │       │ - Sound on New Orders   │
└─────────────────────────┘       └─────────────────────────┘
```

---

## 2. Customer Notification Lifecycle

1. **Order Received**: "تم استلام طلبك بنجاح! رقم الطلب #PH-1024. جاري مراجعة التحويل."
2. **Payment Verified / Order Confirmed**: "تم تأكيد طلبك وموعد الاستلام المجدول الساعة 8:00 مساءً."
3. **In the Oven (Preparing)**: "بدأنا تحضير البيتزا الخاصة بك الآن! 🍕"
4. **Ready for Pickup**: "طلبك جاهز وساخن الآن في الفرع! يمكنك التوجه للاستلام."
5. **Completed**: "شكراً لزيارتك بيتزا هاوس! بالهناء والشفاء."

---

## 3. Kitchen Audio & Visual Alerts

- In noisy kitchen environments, visual updates alone are insufficient.
- The Kitchen Display System utilizes the browser **Web Audio API** to generate pleasant, audible chimes:
  - Two-tone bell when an order enters the active `READY_TO_PREPARE` state.
  - Distinct alert tone when a rush or ASAP order is received.
- Visual pulse on the card border (glowing amber) until the cook acknowledges the ticket by tapping `Start Baking`.

---

## 4. WhatsApp Strategic Integration

- Avoid expensive, brittle third-party WhatsApp bot subscriptions in MVP.
- Instead, utilize structured `https://wa.me/967772207788?text=...` deep-linking:
  - Customers can click "تواصل معنا عبر واتساب بخصوص هذا الطلب" directly on their order tracking page.
  - Pre-fills message with order number, requested pickup time, and customer name.
  - Cashier can click a single button to initiate a chat with the customer if a clarification is needed.
