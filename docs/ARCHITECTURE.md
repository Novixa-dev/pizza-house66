# Technical Architecture: Modular Monolith

## 1. Architectural Philosophy

The Pizza House platform is architected as a **Modular Monolith** using Next.js 14+ (App Router) and TypeScript.

### Rationale:
- **Zero Network Latency Between Modules**: Domain services (Catalog, Cart, Scheduler, KDS, Payments) communicate via type-safe in-process function calls rather than fragile HTTP microservices.
- **Single Source of Truth**: Shared domain types, Zod schemas, and Prisma ORM models ensure compile-time type safety end-to-end.
- **Operational Simplicity**: Can be deployed with minimal devops overhead to Vercel, Docker, VPS, or cloud instances.
- **Path to Novixa SaaS**: Clear domain boundaries enable modular extraction when transitioning to multi-tenant Novixa Restaurant.

---

## 2. Layered Architecture Diagram

```text
┌──────────────────────────────────────────────────────────────┐
│                    Presentation Layer                        │
│  - Public Web (Customer Discovery & Menu Browsing)           │
│  - Customizer & Cart Drawer                                  │
│  - Checkout & Tracking Flow                                  │
│  - Kitchen Display System (/kitchen)                         │
│  - Admin Operations Dashboard (/admin)                       │
└──────────────────────────────┬───────────────────────────────┘
                               │ React Server Components / Client Actions
┌──────────────────────────────▼───────────────────────────────┐
│                    Application / Action Layer                │
│  - Server Actions (orderActions, paymentActions, menuActions)│
│  - Zod Request Validation & Sanitization                     │
│  - Role-Based Session / Auth Checks                          │
└──────────────────────────────┬───────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────┐
│                      Domain Services Layer                   │
│  - PricingCalculationEngine (authoritative recalculation)    │
│  - SchedulingEngine (slot generation, prep release windows)  │
│  - OrderStateMachine (state transitions & lifecycle events)  │
│  - PaymentVerificationService (receipt handling & audit)     │
│  - InventoryAvailabilityService (sold-out & pause controls)  │
└──────────────────────────────┬───────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────┐
│                 Data Persistence & Storage Layer             │
│  - Prisma ORM Client                                         │
│  - SQLite (Local Dev / Portable) / PostgreSQL (Production)   │
│  - Local Encrypted Media Storage (/uploads/receipts)         │
└──────────────────────────────────────────────────────────────┘
```

---

## 3. Directory Structure

```text
pizza-house66/
├── docs/                        # Complete 25-module documentation suite
├── prisma/
│   ├── schema.prisma            # Relational database schema
│   ├── seed.ts                  # Authentic Mukalla seed data
├── public/
│   ├── images/                  # Pizza, pastry, and branding assets
│   ├── uploads/receipts/        # Isolated, access-controlled receipt files
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── (public)/            # Customer-facing routes (/, /menu, /track/[id])
│   │   ├── (ops)/
│   │   │   ├── kitchen/         # KDS screen
│   │   │   └── admin/           # Manager & cashier control center
│   │   ├── api/                 # API endpoints & upload handlers
│   │   ├── layout.tsx           # Root bilingual RTL/LTR layout
│   │   └── globals.css          # Design system tokens & utility classes
│   ├── components/
│   │   ├── ui/                  # Reusable accessible primitives (Button, Modal, Input)
│   │   ├── customer/            # MenuCard, CustomizerModal, CartDrawer, SlotPicker
│   │   ├── kitchen/             # KDSTicketCard, KDSColumn, AudioAlert
│   │   ├── admin/               # OrderTable, ReceiptViewerModal, StatsCard
│   │   └── shared/              # Header, Footer, LanguageToggle, ThemeToggle
│   ├── lib/
│   │   ├── prisma.ts            # Singleton Prisma client instance
│   │   ├── scheduler.ts         # Pickup & kitchen release timing engine
│   │   ├── pricing.ts           # Authoritative price calculator
│   │   ├── i18n/                # Arabic & English dictionary dictionaries
│   │   └── validation.ts        # Zod schemas for all forms & payloads
│   └── types/                   # Shared TypeScript domain types
└── tests/
    ├── unit/                    # Pricing and scheduling algorithmic tests
    └── e2e/                     # Playwright full-flow integration tests
```
