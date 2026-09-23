"use client";

import React from "react";
import {
  Clock,
  CalendarClock,
  Flame,
  CheckCircle2,
  PackageCheck,
  XCircle,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { OrderStatus, PaymentStatus, Language } from "@/types";

/**
 * The visual half of the order state machine.
 *
 * Every status carries three independent signals — colour, icon and label —
 * because colour alone fails for colour-blind staff and in the glare of a
 * kitchen screen. The `tone` names map to the semantic status tokens, so the
 * ramp stays coherent in both themes without per-component dark: overrides.
 */

type Tone = "pending" | "scheduled" | "active" | "ready" | "done" | "danger";

const TONE_CLASSES: Record<Tone, string> = {
  pending: "bg-status-pending-bg text-status-pending-fg",
  scheduled: "bg-status-scheduled-bg text-status-scheduled-fg",
  active: "bg-status-active-bg text-status-active-fg",
  ready: "bg-status-ready-bg text-status-ready-fg",
  done: "bg-status-done-bg text-status-done-fg",
  danger: "bg-status-danger-bg text-status-danger-fg",
};

interface StatusPresentation {
  tone: Tone;
  icon: LucideIcon;
  ar: string;
  en: string;
  /** Draws attention while the order needs someone to act on it. */
  live?: boolean;
}

/**
 * Customer-facing wording, not internal state names. A customer should read
 * "قيد التحضير", never "PREPARING".
 */
const ORDER_STATUS: Record<OrderStatus, StatusPresentation> = {
  PENDING:         { tone: "pending",   icon: Clock,         ar: "قيد الاستلام",      en: "Received" },
  PAYMENT_PENDING: { tone: "pending",   icon: Wallet,        ar: "بانتظار تأكيد الدفع", en: "Payment under review", live: true },
  CONFIRMED:       { tone: "scheduled", icon: CheckCircle2,  ar: "تم التأكيد",        en: "Confirmed" },
  QUEUED:          { tone: "scheduled", icon: CalendarClock, ar: "مجدول للتحضير",     en: "Scheduled" },
  PREPARING:       { tone: "active",    icon: Flame,         ar: "قيد التحضير",       en: "Preparing", live: true },
  READY:           { tone: "ready",     icon: PackageCheck,  ar: "جاهز للاستلام",     en: "Ready for pickup", live: true },
  COMPLETED:       { tone: "done",      icon: CheckCircle2,  ar: "تم التسليم",        en: "Completed" },
  CANCELLED:       { tone: "danger",    icon: XCircle,       ar: "ملغي",              en: "Cancelled" },
  REJECTED:        { tone: "danger",    icon: XCircle,       ar: "مرفوض",             en: "Rejected" },
};

const PAYMENT_STATUS: Record<PaymentStatus, StatusPresentation> = {
  UNPAID:               { tone: "pending", icon: Wallet,       ar: "الدفع عند الاستلام", en: "Pay at pickup" },
  PENDING_VERIFICATION: { tone: "active",  icon: Clock,        ar: "قيد المراجعة",       en: "Under review", live: true },
  VERIFIED:             { tone: "ready",   icon: CheckCircle2, ar: "تم التحقق",          en: "Verified" },
  REJECTED:             { tone: "danger",  icon: XCircle,      ar: "مرفوض",              en: "Rejected" },
};

const SIZES = {
  sm: "text-2xs px-2 py-0.5 gap-1",
  md: "text-xs px-2.5 py-1 gap-1.5",
  lg: "text-sm px-3 py-1.5 gap-2",
} as const;

const ICON_SIZES = { sm: "w-3 h-3", md: "w-3.5 h-3.5", lg: "w-4 h-4" } as const;

interface BadgeProps {
  language: Language;
  size?: keyof typeof SIZES;
  className?: string;
}

function Badge({
  presentation,
  language,
  size = "md",
  className,
}: BadgeProps & { presentation: StatusPresentation }) {
  const Icon = presentation.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-control font-semibold whitespace-nowrap",
        TONE_CLASSES[presentation.tone],
        SIZES[size],
        className
      )}
    >
      <Icon
        className={cn(
          ICON_SIZES[size],
          "shrink-0",
          presentation.live && "animate-status-pulse"
        )}
        aria-hidden="true"
      />
      <span>{language === "ar" ? presentation.ar : presentation.en}</span>
    </span>
  );
}

export function OrderStatusBadge({
  status,
  ...props
}: BadgeProps & { status: OrderStatus }) {
  return <Badge presentation={ORDER_STATUS[status]} {...props} />;
}

export function PaymentStatusBadge({
  status,
  ...props
}: BadgeProps & { status: PaymentStatus }) {
  return <Badge presentation={PAYMENT_STATUS[status]} {...props} />;
}

/** Label lookup for contexts that need the text without the badge chrome. */
export function orderStatusLabel(status: OrderStatus, language: Language) {
  const p = ORDER_STATUS[status];
  return language === "ar" ? p.ar : p.en;
}
