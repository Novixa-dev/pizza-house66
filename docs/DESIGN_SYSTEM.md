# Design System: Visual Identity & Component Standards

## 1. Design Direction: Modern Artisan Pizzeria

The visual identity avoids generic SaaS templates and artificial aesthetic bloat. Instead, it channels a rich, appetizing, authentic culinary experience:
- **Warmth & Craftsmanship**: Reminiscent of wood-fired ovens, golden toasted crusts, and rich tomato sauces.
- **High Operational Contrast**: Clean cards, readable Arabic type, clear status badges, and large touch targets for kitchen screens and mobile fingers.

---

## 2. Color System

```css
:root {
  /* Brand Primary: Pizza Rust / Deep Terracotta */
  --primary: #C2410C;           /* Rich, appetizing red-orange */
  --primary-hover: #9A3412;
  --primary-foreground: #FFFFFF;

  /* Accent: Golden Crust */
  --accent: #F59E0B;            /* Warm oven gold */
  --accent-foreground: #1E1B18;

  /* Neutrals (Light Mode) */
  --background: #FFFDF9;        /* Warm flour/cream tone */
  --surface: #FFFFFF;
  --surface-raised: #F8F5EE;
  --border: #E8E2D5;
  --text-primary: #1C1917;      /* Stone charcoal */
  --text-secondary: #78716C;
  --text-muted: #A8A29E;

  /* Status Tokens */
  --status-pending: #F59E0B;     /* Amber */
  --status-preparing: #EA580C;   /* Warm Orange */
  --status-ready: #16A34A;       /* Fresh Basil Green */
  --status-completed: #2563EB;   /* Navy Blue */
  --status-danger: #DC2626;      /* Bright Crimson */
}

.dark {
  /* Dark Mode Surfaces */
  --background: #0F0E0C;        /* Deep charcoal oven night */
  --surface: #181715;
  --surface-raised: #24221F;
  --border: #33302A;
  --text-primary: #F5F5F4;
  --text-secondary: #A8A29E;
  --text-muted: #78716C;
}
```

---

## 3. Typography Hierarchy

- **Arabic Typography**: **Cairo** (`font-cairo`) and **Tajawal** for clear headings, high legibility on mobile screens, and natural vowel balance.
- **Latin / Numerals**: **Outfit** (`font-outfit`) or **Inter** for clean numerical formatting (prices, times, order references).
- **Type Scale**:
  - `Display / Hero Title`: 2.5rem – 3.25rem (Bold / 800)
  - `H1 / Page Title`: 1.875rem – 2.25rem (Bold / 700)
  - `H2 / Section Title`: 1.5rem – 1.75rem (SemiBold / 600)
  - `H3 / Card Title`: 1.125rem – 1.25rem (SemiBold / 600)
  - `Body Text`: 0.9375rem – 1rem (Regular / 400, line-height: 1.6)
  - `Caption / Badge`: 0.75rem – 0.8125rem (Medium / 500)

---

## 4. Directionality & RTL Support

- Natural RTL layout with CSS logical properties (`margin-inline-start`, `padding-inline-end`, `inset-inline-start`).
- Directional icons (arrows, chevrons) automatically mirror when switching between Arabic and English.
- Numbers and phone numbers formatted with `dir="ltr"` to preserve proper sequencing (`+967 772207788`).

---

## 5. Micro-Interactions & Motion

- Subtle scale and shadow elevation on product hover (`transform: translateY(-2px)`).
- Cart drawer transitions with smooth ease-out curves (250ms).
- Order status pulses on the live tracking screen.
- Respects `prefers-reduced-motion`.
