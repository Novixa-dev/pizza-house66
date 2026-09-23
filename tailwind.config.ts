import type { Config } from "tailwindcss";

/** Semantic colour token -> Tailwind colour, preserving the `/alpha` modifier. */
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        /* ---- Semantic roles (prefer these in all new code) --------------- */
        surface: {
          DEFAULT: token("surface-default"),
          page: token("surface-page"),
          raised: token("surface-raised"),
          sunken: token("surface-sunken"),
          inverse: token("surface-inverse"),
          overlay: token("surface-overlay"),
        },
        content: {
          DEFAULT: token("content-primary"),
          secondary: token("content-secondary"),
          muted: token("content-muted"),
          inverse: token("content-inverse"),
        },
        brand: {
          DEFAULT: token("brand"),
          hover: token("brand-hover"),
          subtle: token("brand-subtle"),
          content: token("brand-content"),
        },
        accent: {
          DEFAULT: token("accent"),
          subtle: token("accent-subtle"),
          content: token("accent-content"),
        },
        status: {
          "pending-fg": token("status-pending-fg"),
          "pending-bg": token("status-pending-bg"),
          "scheduled-fg": token("status-scheduled-fg"),
          "scheduled-bg": token("status-scheduled-bg"),
          "active-fg": token("status-active-fg"),
          "active-bg": token("status-active-bg"),
          "ready-fg": token("status-ready-fg"),
          "ready-bg": token("status-ready-bg"),
          "done-fg": token("status-done-fg"),
          "done-bg": token("status-done-bg"),
          "danger-fg": token("status-danger-fg"),
          "danger-bg": token("status-danger-bg"),
        },
        focus: token("focus-ring"),
      },

      /* Border roles get their own scale so the class reads `border-subtle`
       * rather than `border-border-subtle`. */
      borderColor: {
        subtle: token("border-subtle"),
        default: token("border-default"),
        strong: token("border-strong"),
      },
      divideColor: {
        subtle: token("border-subtle"),
        default: token("border-default"),
      },
      ringColor: {
        focus: token("focus-ring"),

        /* ---- Legacy palette -------------------------------------------- */
        /* Retained so the existing views keep compiling while they migrate to
         * the semantic roles above. Do not reach for these in new code. */
        pizza: {
          50: "#fff3ed", 100: "#ffe2d4", 200: "#fed7aa", 300: "#fdba74",
          400: "#fb923c", 500: "#ea580c", 600: "#d0460a", 700: "#b23a09",
          800: "#8a2e0a", 900: "#5f2108", 950: "#431407",
        },
        crust: {
          50: "#fffbeb", 100: "#fef3c7", 200: "#fde68a", 300: "#fcd34d",
          400: "#fbbf24", 500: "#f59e0b", 600: "#d97706", 700: "#b45309",
          800: "#92400e", 900: "#78350f",
        },
        basil: {
          50: "#f0fdf4", 100: "#dcfce7", 500: "#22c55e", 600: "#16a34a", 700: "#15803d",
        },
        stone: { 850: "#1f1d1a", 900: "#1c1916", 950: "#12100e" },
      },

      /* ---- Type scale -----------------------------------------------------
       * Arabic (Cairo) sits optically smaller than Latin at the same px and
       * needs more line-height for its diacritics, hence the generous leading. */
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1rem" }],        // 11px  micro-labels
        xs:    ["0.75rem",   { lineHeight: "1.125rem" }],    // 12px  meta
        sm:    ["0.875rem",  { lineHeight: "1.375rem" }],    // 14px  secondary
        base:  ["1rem",      { lineHeight: "1.625rem" }],    // 16px  body
        lg:    ["1.125rem",  { lineHeight: "1.75rem" }],     // 18px  lead
        xl:    ["1.25rem",   { lineHeight: "1.875rem" }],    // 20px  card title
        "2xl": ["1.5rem",    { lineHeight: "2.125rem" }],    // 24px  section
        "3xl": ["1.875rem",  { lineHeight: "2.375rem" }],    // 30px
        "4xl": ["2.25rem",   { lineHeight: "2.75rem",  letterSpacing: "-0.015em" }],
        "5xl": ["2.875rem",  { lineHeight: "3.25rem",  letterSpacing: "-0.02em" }],
        "6xl": ["3.5rem",    { lineHeight: "3.875rem", letterSpacing: "-0.025em" }],
      },

      /* ---- Radius scale ---------------------------------------------------
       * Deliberately restrained. Interactive controls and cards share one
       * family; the sprawl of rounded-xl/2xl/3xl reads as template filler. */
      borderRadius: {
        control: "0.5rem",   //  8px  buttons, inputs, badges
        card:    "0.75rem",  // 12px  cards, panels
        panel:   "1rem",     // 16px  sheets, modals, drawers
      },

      /* ---- Elevation ------------------------------------------------------
       * Four steps only. Shadows convey layering, not decoration — so they are
       * tight, low-opacity and warm-tinted rather than large and grey. */
      boxShadow: {
        raised: "0 1px 2px 0 rgb(28 25 22 / 0.05), 0 1px 3px 0 rgb(28 25 22 / 0.06)",
        popover: "0 4px 12px -2px rgb(28 25 22 / 0.10), 0 2px 6px -2px rgb(28 25 22 / 0.06)",
        sheet: "0 12px 32px -8px rgb(28 25 22 / 0.18), 0 4px 12px -4px rgb(28 25 22 / 0.10)",
        none: "none",
      },

      fontFamily: {
        cairo: ["var(--font-cairo)", "sans-serif"],
        outfit: ["var(--font-outfit)", "sans-serif"],
      },

      /* ---- Motion ---------------------------------------------------------
       * Short and eased-out. Every one of these is gated behind
       * prefers-reduced-motion in globals.css. */
      keyframes: {
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "status-pulse": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.45" },
        },
      },
      animation: {
        "fade-in": "fade-in 150ms ease-out",
        "slide-up": "slide-up 200ms cubic-bezier(0.16, 1, 0.3, 1)",
        "status-pulse": "status-pulse 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
