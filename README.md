# Pizza House (بيتزا هاوس) — Digital Ordering & Restaurant Operations Platform
> **Mukalla, Hadhramaut, Yemen** | Official Account: [@pizza_house66](https://www.instagram.com/pizza_house66/)  
> Validation Pilot for **Novixa Restaurant Technology Platform**

---

## 🍕 Overview

**Pizza House** is a production-grade digital pre-ordering and kitchen operations platform built specifically for the operational reality of Mukalla, Yemen. It addresses the primary friction of in-store dining and takeaway: **eliminating customer waiting times (15–25 minutes) through an Intelligent Scheduled Preparation Engine**.

### Core Value Proposition
- **Scheduled Preparation Engine**: Automatically calculates oven release time based on customer pickup schedule ($T_{\text{release}} = T_{\text{pickup}} - T_{\text{prep}}$) to ensure pizza comes out of the oven sizzling hot at the exact minute the customer arrives.
- **Arabic-First, RTL Native UX**: Built with warm, premium appetite-stimulating aesthetics (Deep Charcoal `#121214`, Warm Amber/Gold `#F59E0B`, Rich Crimson `#DC2626`).
- **Zero-Friction Authentication**: Phone-based identity verification without passwords.
- **Local Payment Architecture**: Supports Pay at Pickup (Cash) + Yemen local hawala/mobile wallets (Al-Kuraimi, Al-Amqi, Al-Busairi) with receipt voucher upload and cashier 1-click verification.
- **Real-Time Kitchen Display System (KDS)**: 4-stage Kanban kitchen board (New, Scheduled, Baking, Ready) with sound alerts and urgency badges.
- **Manager Operations Center**: Full control over emergency order pause, per-item 86ing (stock toggles), order management, receipt verification, and revenue metrics.
- **Zero-Trust Pricing Architecture**: 100% server-side recalculation of base prices, crusts, and toppings to prevent client-side manipulation.

---

## 📂 Project Structure

```
pizza-house66/
├── docs/                       # Complete 25-module architectural & business documentation
│   ├── PROJECT_ORIGIN.md       # Origin story, Mukalla local context, Instagram research
│   ├── PRODUCT_VISION.md       # Strategic vision & Novixa Restaurant roadmap
│   ├── RESTAURANT_DISCOVERY.md # Physical audit, equipment, menu, shift hours
│   ├── MARKET_RESEARCH.md      # Mukalla demographics, food scene, infrastructure
│   ├── COMPETITIVE_ANALYSIS.md # Mukalla competitors & differentiation
│   ├── USER_FLOWS.md           # Mermaid flowcharts for customer, cashier, & kitchen
│   ├── BUSINESS_RULES.md       # Scheduling formulas, cancellation rules, pricing
│   ├── FEATURE_SPECIFICATION.md# Complete functional matrix (P0, P1, P2)
│   ├── ROLES_PERMISSIONS.md    # RBAC model for Customer, Kitchen, Cashier, Admin
│   ├── ARCHITECTURE.md         # Next.js App Router modular monolith architecture
│   ├── DATABASE.md             # Prisma relational data model & indexing strategy
│   ├── SECURITY.md             # OWASP, anti-tamper pricing, rate limits
│   ├── SEO.md                  # JSON-LD Schema.org Restaurant metadata, OpenGraph
│   ├── DESIGN_SYSTEM.md        # Typography, color tokens, RTL guidelines
│   ├── NOTIFICATIONS.md        # WhatsApp & SMS notification strategy
│   ├── PAYMENTS.md             # Yemeni payment rails (Kuraimi, Amqi, Busairi)
│   ├── SCHEDULING.md           # Prep-time scheduling algorithm specification
│   ├── KITCHEN_WORKFLOW.md     # KDS station workflows & ticket lifecycle
│   ├── ANALYTICS.md            # Revenue, prep-accuracy, and volume metrics
│   ├── TESTING.md              # E2E, unit test, and manual QA runbook
│   ├── DEPLOYMENT.md           # Production deployment, Docker, Vercel/Node.js
│   ├── ROADMAP.md              # 4-phase rollout (Pickup MVP -> Delivery Fleet)
│   ├── AI_STRATEGY.md          # Demand forecasting & smart prep optimization
│   ├── DECISIONS.md            # Architectural Decision Records (ADRs)
│   └── OWNER_INPUT_REQUIRED.md # Formatted interview questions for restaurant owners
├── prisma/
│   ├── schema.prisma           # Relational schema (12 models)
│   └── seed.ts                 # Authentic Mukalla menu, options, and operational orders
├── src/
│   ├── app/
│   │   ├── actions/            # Server actions (Zero-trust pricing, status, receipts)
│   │   ├── admin/              # Management operations & receipt verification dashboard
│   │   ├── checkout/           # Multi-step scheduling & local payment checkout
│   │   ├── kitchen/            # Live Kitchen Display System (KDS) board
│   │   ├── menu/               # Interactive menu with category filtering & item customizer
│   │   ├── track/              # Live order tracking with progress bar & WhatsApp link
│   │   ├── globals.css         # Custom styling, dark mode tokens & glassmorphism
│   │   ├── layout.tsx          # Root layout with Cairo & Outfit fonts, RTL support
│   │   └── page.tsx            # High-conversion storefront homepage
│   ├── components/             # Reusable UI components (CartDrawer, CustomizerModal, etc.)
│   ├── context/                # AppContext (Cart state, Language RTL/LTR switch)
│   └── lib/                    # Core utilities (Prisma client, Scheduler, i18n dictionaries)
├── public/                     # Static assets & icons
├── package.json                # Dependencies & npm scripts
├── tailwind.config.ts          # TailwindCSS configuration
└── tsconfig.json               # TypeScript configuration
```

---

## 🚀 Quick Start

### 1. Requirements
- Node.js 18.x or 20.x
- npm or yarn

### 2. Installation
```bash
# Clone or navigate to the repository
cd pizza-house66

# Install dependencies
npm install
```

### 3. Database Setup & Seeding
```bash
# Push schema to SQLite database (dev.db)
npx prisma db push

# Seed authentic Mukalla restaurant data (Categories, Products, Options, Orders)
npm run db:seed
```

### 4. Running the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Running the Production Build
```bash
npm run build
npm run start
```

---

## 🖥️ Live Route Map

| URL Route | Role | Description |
|---|---|---|
| `/` | Customer | Premium landing page with brand hero, scheduled pre-order banner, featured items, and Mukalla branch location details. |
| `/menu` | Customer | Categorized menu with instant search, interactive pizza customizer (crust, size, extra toppings), and dynamic pricing. |
| `/checkout` | Customer | Order finalization with intelligent pickup time slot selector, zero-password phone identification, and Kuraimi/Amqi/Cash payment. |
| `/track/[id]` | Customer | Real-time visual order timeline (Received $\to$ Scheduled $\to$ In Oven $\to$ Ready) with Google Maps location and direct WhatsApp support button. |
| `/kitchen` | Kitchen Staff | Live KDS Kanban board organized into New, Scheduled Prep, In Oven, and Ready for Pickup columns with status advancement buttons and prep countdowns. |
| `/admin` | Manager / Cashier | Operational dashboard with live metrics (Revenue, Active Orders, Queue status), Emergency Pause toggle, Product stock (86ing) toggles, and Payment Receipt review drawer. |

---

## 💰 Yemeni Payment Rails Configured

Pizza House Mukalla accepts cash at pickup alongside direct electronic transfers to verified local accounts:

| Provider | Merchant Account Number | Beneficiary Name |
|---|---|---|
| **Al-Kuraimi Bank (الكريمي)** | `PH-772207788` | بيتزا هاوس فوة المساكن |
| **Al-Amqi Exchange (العمقي)** | `25401982` | بيتزا هاوس - المكلا |
| **Al-Busairi Exchange (البصيري)**| `889104` | مطعم بيتزا هاوس |
| **Pay at Pickup (نقداً عند الاستلام)** | N/A | Cashier counter at Fuwa branch |

---

## 🧪 Automated Verification & Testing

The platform has undergone full end-to-end browser subagent testing verifying:
1. RTL layout and Cairo typography rendering.
2. Menu customization with price accumulation (Pepperoni Pizza Large + Mozzarella Stuffed Crust = 9,500 YER).
3. Scheduled checkout order creation (`#PH-1027`).
4. Real-time order tracking status updates.
5. Kitchen KDS ticket lifecycle progression.
6. Admin operations metrics calculation, product availability toggle, and receipt verification.

---

## 📜 License & Ownership
Created as an authentic commercial restaurant platform for **Pizza House Mukalla** (`@pizza_house66`) and the foundational architecture of **Novixa Restaurant**.  
All rights reserved © 2026.
