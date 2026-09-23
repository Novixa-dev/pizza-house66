# Checklist of Inputs Required from Pizza House Owner

The following items are **OWNER INPUT REQUIRED**.

Everything in `RESTAURANT_DISCOVERY.md` is an `ASSUMPTION`, not research. Plausible Mukalla
defaults are seeded so the demo feels real, **except financial account numbers, which are
deliberately blank** — an unconfirmed account number shown to a paying customer is a real-money
risk, so the UI displays "not yet confirmed" instead.

| Item | Current Working Default | Owner Input Needed |
| :--- | :--- | :--- |
| **Exact Item Prices** | `ASSUMPTION` — invented, not benchmarked against any source (Margherita 3,500/5,500/7,500 YER; Pepperoni 4,500/7,000/9,500 YER). | Official printed menu / price sheet with any recent inflation updates. |
| **Active Bank & Wallet Accounts** | 🚫 **BLANK — intentionally not assumed.** UI shows "account number not yet confirmed". | ❗ **BLOCKING.** Exact recipient account numbers + beneficiary names, and which rails are actually accepted. Transfer checkout cannot go live without these. |
| **Kitchen Oven Capacity** | `ASSUMPTION` — 8 orders per 15-minute slot. | Maximum number of pizzas the kitchen oven deck can bake simultaneously during peak rush. |
| **Preparation Duration per Category** | `ASSUMPTION` — Pizzas 15–20 min; Fatayer 10–12 min; Sides 8 min. Note: only a single restaurant-wide `defaultPrepDuration` is implemented; per-category prep is not yet in the schema. | Confirmed prep times under normal and busy kitchen shifts. |
| **Current Counter POS** | Handled as a self-contained digital ordering layer. | Name of software (if any) currently running at the cash register (e.g. Al-Ameen, Onyx Pro, etc.) for future direct API sync. |
| **Delivery Policies (Phase 4)** | Disabled in MVP (Pickup-first). | In-house delivery riders available, or preference to partner with local logistics. |

---

## Also unconfirmed (not previously listed)

| Item | Status |
| :--- | :--- |
| Menu items & category structure | `ASSUMPTION` — representative, not transcribed from a real Pizza House menu. |
| Phone / WhatsApp numbers (`05375561`, `772207788`, `711227788`, `738227788`) | `ASSUMPTION` — seeded and rendered in the UI. Confirm before any demo. |
| Street address & landmarks | `ASSUMPTION`. |
| Weekly shift hours (incl. Friday morning closure) | `ASSUMPTION` — drives pickup-slot generation, so wrong hours means wrong slots. |
| Instagram follower count (~68,000) | `ASSUMPTION` — remove from all owner-facing material. |
| Restaurant logo & brand colours | Not supplied. Current palette is a design choice, not the restaurant's identity. |
