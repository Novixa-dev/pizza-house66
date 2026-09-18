# Artificial Intelligence (AI) Strategy

## 1. Operating Principle: AI as Assistant, Not Authority

The platform embraces modern AI capabilities where they deliver concrete operational value, while strictly adhering to safety principles:

> **AI must never execute irreversible financial transactions or order state changes without human staff confirmation.**

---

## 2. High-Value AI Opportunities

### 2.1 AI Receipt OCR Assistant (Phase 4)
- **Problem**: Cashiers reviewing bank transfer screenshots must read tiny numbers on varying bank receipt formats (Kuraimi, Amqi, Busairi).
- **AI Solution**: Multimodal Vision API extracts:
  - Amount in YER
  - Transaction Reference ID
  - Date & Time
  - Bank / Sender Name
- **Human Loop**: The cashier UI presents the extracted data alongside the image with a confidence badge. The cashier taps "Confirm & Approve" or manually corrects.

### 2.2 AI Operational Sales & Demand Summarizer
- At the end of each evening shift, generate a plain-Arabic summary for the restaurant owner:
  - "اليوم كان الأكثر مبيعاً بيتزا الببروني ودجاج الرانش (إجمالي 48 بيتزا). ساعة الذروة كانت بين 8:30 و 9:15 مساءً. متوسط وقت انتظار الزبون انخفض بنسبة 60% مقارنة بالشهر الماضي."
  - Provides actionable inventory procurement advice for the next day's dough and cheese prep.

### 2.3 Automated Bilingual Translation Assistant
- When managers add a new seasonal pizza or pastry description in Arabic, the system offers high-quality culinary English translations with a single click.
