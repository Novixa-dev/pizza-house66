"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * The single button in the system.
 *
 * Deliberately flat: solid fills, no gradients. A gradient on a primary CTA is
 * the clearest tell of a template, and it makes the brand colour ambiguous —
 * the eye cannot name the colour it just saw.
 *
 * Every variant keeps a 44px minimum touch target at `md` and above, which is
 * the practical floor for thumb use on the phones most customers order from.
 */

const VARIANTS = {
  /** One primary action per view. */
  primary:
    "bg-brand text-brand-content hover:bg-brand-hover shadow-raised " +
    "disabled:bg-brand/50",
  /** Neutral, bordered. The default for most actions. */
  secondary:
    "bg-surface text-content border border-default hover:bg-surface-sunken " +
    "disabled:text-content-muted",
  /** Low emphasis, no chrome until hovered. */
  ghost:
    "text-content-secondary hover:bg-surface-sunken hover:text-content " +
    "disabled:text-content-muted",
  /** Destructive or rejecting actions. Never the default in a form. */
  danger:
    "bg-status-danger-fg text-surface hover:opacity-90 shadow-raised " +
    "disabled:opacity-50",
  /** Confirming actions in operational UI (approve payment, mark ready). */
  confirm:
    "bg-status-ready-fg text-surface hover:opacity-90 shadow-raised " +
    "disabled:opacity-50",
} as const;

const SIZES = {
  sm: "text-xs px-3 py-1.5 gap-1.5 rounded-control min-h-[32px]",
  md: "text-sm px-4 py-2.5 gap-2 rounded-control min-h-[44px]",
  lg: "text-base px-6 py-3.5 gap-2.5 rounded-control min-h-[52px]",
} as const;

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
  isLoading?: boolean;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "secondary",
      size = "md",
      isLoading = false,
      fullWidth = false,
      className,
      children,
      disabled,
      type = "button",
      ...props
    },
    ref
  ) {
    return (
      <button
        ref={ref}
        type={type}
        // A loading button stays disabled so a double-tap cannot submit twice.
        disabled={disabled || isLoading}
        aria-busy={isLoading || undefined}
        className={cn(
          "inline-flex items-center justify-center font-semibold",
          "transition-colors duration-150",
          "active:scale-[0.98] motion-reduce:active:scale-100",
          "disabled:cursor-not-allowed disabled:active:scale-100",
          VARIANTS[variant],
          SIZES[size],
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />}
        {children}
      </button>
    );
  }
);
