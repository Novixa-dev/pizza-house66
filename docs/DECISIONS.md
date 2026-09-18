# Architecture Decision Records (ADR)

## ADR-001: Modular Monolith in Next.js App Router

- **Context**: Need a modern, maintainable full-stack application supporting public ordering, kitchen operations, and admin controls.
- **Decision**: Build a single modular monolith using Next.js 14+ with App Router and TypeScript.
- **Consequences**: Fast development speed, single deployment target, shared type definitions, zero microservice network latency.

---

## ADR-002: Pickup-First MVP (Decoupling Delivery)

- **Context**: Mukalla has unmapped streets and local delivery logistics add driver coordination overhead. The core problem observed was in-store waiting.
- **Decision**: Focus MVP exclusively on Pickup (ASAP + Scheduled Pickup).
- **Consequences**: Solves the immediate waiting problem cleanly without delivery complexity. Delivery can be layered in Phase 4.

---

## ADR-003: Authoritative Server-Side Pricing Recalculation

- **Context**: Browsers are untrusted environments; customers could alter request JSON payloads to change prices.
- **Decision**: The server looks up current database prices for products and option groups, completely ignoring client price fields.
- **Consequences**: 100% financial integrity, eliminating forged order amounts.

---

## ADR-004: Decoupled Scheduled Preparation vs Creation Time

- **Context**: A scheduled order placed at 4:00 PM for 8:00 PM pickup must not be baked at 4:05 PM.
- **Decision**: Calculate $\text{Release Time} = \text{Pickup Time} - \text{Prep Duration}$. Keep order in `QUEUED` until the release window arrives, then transition to `READY_TO_PREPARE`.
- **Consequences**: Guarantees food freshness and zero customer wait time on arrival.

---

## ADR-005: Manual Cashier Verification for Bank Transfer Receipts

- **Context**: Yemen banking relies on peer-to-peer transfer apps (Kuraimi, Amqi, Busairi) without automated webhooks.
- **Decision**: Customer uploads receipt screenshot $\to$ order enters `PAYMENT_PENDING` $\to$ Cashier reviews and clicks Approve or Reject.
- **Consequences**: Safe, reliable integration matching the real-world operational pattern of Yemeni businesses.
