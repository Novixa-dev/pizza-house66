# Design System

> **Status:** foundation implemented and building. Page migration is partial —
> see [Migration status](#8-migration-status) for exactly which screens are on
> the system and which are still on legacy classes. Nothing in this document is
> aspirational; if it is described here, it exists in the code.

---

## 1. Principles

The product is used in three very different contexts, and the system has to
serve all three without becoming three systems.

| Context | Device | Conditions |
| :--- | :--- | :--- |
| Customer ordering | Phone, one-handed | Distracted, possibly outdoors, may be on a slow connection |
| Kitchen display | Tablet / wall screen | Read at distance, hands busy, glanced at not studied |
| Admin & cashier | Laptop | Sustained use, dense data, money on the line |

From this follow four rules:

1. **Colour never carries meaning alone.** Every status shows colour, an icon
   and a word. Kitchen staff may be colour-blind and screens may be glare-washed.
2. **Flat fills, no gradients.** A gradient on a CTA is the clearest tell of a
   template, and it makes the brand colour unnameable.
3. **Restraint in radius and shadow.** Three radii, three elevations. The
   `rounded-xl / 2xl / 3xl` sprawl reads as filler.
4. **Motion signals state, never decoration.** Cart updated, order advanced,
   payment verified. Everything else stays still.

---

## 2. Token architecture

Two layers, in `src/styles/tokens.css`:

```
PRIMITIVES   --ph-<hue>-<step>        raw palette, never used in JSX
     ↓
SEMANTICS    --surface-* --content-*  role-named, consumed by components
             --border-*  --brand-*
             --status-*  --focus-ring
```

Values are **space-separated RGB channels**, not hex, so Tailwind's
`<alpha-value>` works: `bg-brand/10` → `rgb(178 58 9 / 0.1)`.

Dark mode re-maps **only the semantic layer**. Primitives are never inverted —
a dark surface is not a light surface with flipped luminance, and brand colour
must *lift* in darkness (terracotta-700 → terracotta-500) to stay legible.

Tokens live **outside** `@layer`. They are imported at the top of
`globals.css`, before the `@tailwind` directives, because an `@import`ed file is
a separate PostCSS pass where Tailwind's layer machinery is not in scope — and
token definitions must never be purged or reordered anyway.

---

## 3. Colour roles

### Surfaces
| Utility | Role |
| :--- | :--- |
| `bg-surface-page` | The page behind everything |
| `bg-surface` | Cards, header, default panels |
| `bg-surface-sunken` | Wells, inset areas, secondary bands |
| `bg-surface-inverse` | Inverted blocks |
| `bg-surface-overlay/55` | Modal scrims (always with an alpha) |

### Content
`text-content` · `text-content-secondary` · `text-content-muted` · `text-content-inverse`

### Borders
`border-subtle` (separates) · `border-default` (defines) · `border-strong` (emphasises)

### Brand
`bg-brand` / `text-brand` / `bg-brand-subtle` / `text-brand-content`, plus
`bg-accent` (amber, the "oven glow" — used sparingly, for featured badges).

`*-content` is always the colour that sits **legibly on** that fill. Use it
rather than assuming white.

---

## 4. Order-status ramp

The visual half of the order state machine. Implemented in
`src/components/ui/StatusBadge.tsx`, which is the **only** place order status
becomes pixels.

| Tone | Meaning | Order statuses |
| :--- | :--- | :--- |
| `pending` | Waiting on someone | `PENDING`, `PAYMENT_PENDING` |
| `scheduled` | Accepted, not yet started | `CONFIRMED`, `QUEUED` |
| `active` | In the oven now | `PREPARING` |
| `ready` | Ready for the customer | `READY` |
| `done` | Finished, archived | `COMPLETED` |
| `danger` | Stopped | `CANCELLED`, `REJECTED` |

Statuses needing human action (`PAYMENT_PENDING`, `PREPARING`, `READY`) carry
`live: true`, which pulses the icon. That pulse is the one piece of ambient
motion in the product, and it is gated by `prefers-reduced-motion`.

**Labels are customer-facing wording, not internal state names.** A customer
reads "قيد التحضير" / "Preparing", never `PREPARING`. Both languages are
defined alongside each status, so a status can never be half-translated.

```tsx
<OrderStatusBadge status={order.status} language={language} size="md" />
<PaymentStatusBadge status={payment.status} language={language} />
orderStatusLabel(status, language)  // text without badge chrome
```

---

## 5. Scales

**Type** — tuned for Cairo, which sits optically smaller than Latin at the same
px and needs extra leading for its diacritics. `text-2xs` (11px) through
`text-6xl` (56px), with negative tracking only from `4xl` up.

**Radius** — three values, named by what they wrap:
`rounded-control` (8px, buttons/inputs/badges) ·
`rounded-card` (12px, cards/panels) ·
`rounded-panel` (16px, sheets/modals/drawers)

**Elevation** — three, warm-tinted and tight rather than large and grey:
`shadow-raised` (resting) · `shadow-popover` (floating) · `shadow-sheet` (overlay)

**Motion** — `animate-fade-in` (150ms) · `animate-slide-up` (200ms) ·
`animate-status-pulse` (2s). All reduced to ~0ms under
`prefers-reduced-motion`, rather than removed — the state change still needs to
register.

---

## 6. Components

`src/components/ui/`

| Component | Notes |
| :--- | :--- |
| `Button` | `primary` \| `secondary` \| `ghost` \| `danger` \| `confirm`. 44px min target at `md`+. `isLoading` also disables, so a double-tap cannot submit twice. |
| `Card` | `interactive` is opt-in — hover feedback on a non-clickable card promises a click that isn't there. |
| `Container` | max-w-7xl with the standard gutters. |
| `Section` | Titled section; stops six pages inventing six heading sizes. |
| `EmptyState` | Named state + a way out. An unexplained blank region reads as a bug. |
| `StatusBadge` | See §4. |

`cn()` in `src/lib/cn.ts` merges classes via `tailwind-merge`, so a `className`
prop can actually override a component's own defaults.

---

## 7. Bilingual & theme behaviour

**Arabic is primary.** `<html lang="ar" dir="rtl">` is the SSR default.

Direction and theme are applied by a **blocking inline script in `<head>`**
(`themeAndDirectionScript` in `layout.tsx`) that runs before first paint. A
React effect runs too late and the wrong-theme flash is visible. `AppContext`
restates both on mount so the DOM stays correct if that script was blocked or
storage changed in another tab.

Use **logical properties** throughout — `ms-*`/`me-*`, `ps-*`/`pe-*`,
`start-*`/`end-*`, `text-start`/`text-end`. Physical `left`/`right` breaks RTL.
Directional icons flip via the `DirectionalArrow` pattern (pick the icon by
language) rather than a CSS transform, so the arrow keeps its optical weight.

Numbers, times and phone numbers carry `className="tabular"` and, where they are
Latin-digit sequences inside Arabic text, `dir="ltr"` — otherwise a phone number
renders with its segments reversed.

---

## 8. Migration status

The token layer, Tailwind wiring, `ui/` primitives and the shared header are
**done and building**. Page-level migration is partial.

| Surface | Tokens | Localised | Notes |
| :--- | :---: | :---: | :--- |
| `HomeClientView` | ✅ | ✅ | Rebuilt. Hours now read from the DB, not hardcoded. |
| `Header` | ✅ | ✅ | Rebuilt. Open/closed badge is live (see below). |
| `MenuCard` | ✅ | ✅ | Rebuilt. Featured badge now uses `isFeatured`, not price. |
| `MenuClientView` | ❌ | ✅ | Legacy `pizza-*`/`stone-*` classes. |
| `Footer` | ❌ | ❌ | ~16 hardcoded Arabic strings. |
| `CheckoutClientView` | ❌ | ❌ | ~18 hardcoded Arabic strings. |
| `TrackingClientView` | ❌ | ❌ | ~26 hardcoded Arabic strings. |
| `KitchenClientView` | ❌ | ❌ | Should adopt `StatusBadge`. |
| `AdminClientView` | ❌ | ❌ | ~43 hardcoded Arabic strings — the largest gap. |

**"Localised: ❌" means English mode silently renders Arabic on that screen.**
It is a functional bug, not a polish item: the language toggle appears to work
but most of the product does not follow it.

---

## 9. Bugs fixed during this pass

- **Header claimed "Open now" unconditionally**, at any hour. Now derived from
  `isOpenAt(businessHours)` via `/api/status`, verified against 13 cases
  including shifts that wrap past midnight. The badge renders nothing until the
  status is known rather than guessing.
- **`/kitchen` and `/admin` were in the public customer nav**, advertising
  surfaces that currently have no authentication at all (see `SECURITY.md`).
- **`MenuCard` inferred "best seller" from `basePrice >= 5000`**, ignoring the
  `isFeatured` flag staff actually set — so an expensive item was labelled
  best-selling purely for being expensive.
- **Theme flashed light before switching to dark** on every load.
- **`dir`/`lang` were never restored from storage**, so an English user
  reloading got English text in an RTL layout.
- **`import Link from "next/navigation"`** — an invalid import (no such export).
- **`w-4.5`** — not in Tailwind's scale; silently produced no CSS.
- **`py-0.2`** — likewise invalid.

---

## 10. Rules for new work

1. Reach for a `ui/` primitive before writing a bespoke element.
2. Use semantic tokens. If you are typing `dark:`, the token is missing — add it
   to `tokens.css` instead.
3. No gradients on interactive elements. No `backdrop-blur`.
4. Every user-visible string goes through `dict`. No exceptions.
5. Logical properties only.
6. Every interactive element: a 44px target, a visible `:focus-visible` ring,
   and an accessible name.
7. Every list gets an `EmptyState`. Every async action gets a loading state.
