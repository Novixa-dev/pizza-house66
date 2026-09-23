"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { Clock, CheckCircle2, AlertCircle, MessageCircle, RotateCw, MapPin } from "lucide-react";
import { cn } from "@/lib/cn";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { OrderStatusBadge } from "@/components/ui/StatusBadge";
import type { OrderStatus } from "@/types";

interface OrderItemOption {
  id: string;
  nameAr: string;
  nameEn: string;
}

interface OrderItem {
  id: string;
  quantity: number;
  productNameAr: string;
  productNameEn: string;
  subtotal: number;
  itemNotes: string | null;
  options: OrderItemOption[];
}

interface TrackedOrder {
  orderNumber: string;
  status: OrderStatus;
  pickupMode: string;
  requestedPickupTime: string | Date;
  total: number;
  items: OrderItem[];
  payment: { rejectReason: string | null } | null;
}

/** Statuses at or beyond which each milestone counts as reached. */
const REACHED: Record<string, OrderStatus[]> = {
  received: ["CONFIRMED", "QUEUED", "PREPARING", "READY", "COMPLETED"],
  preparing: ["PREPARING", "READY", "COMPLETED"],
  ready: ["READY", "COMPLETED"],
  completed: ["COMPLETED"],
};

export default function TrackingClientView({ order }: { order: TrackedOrder }) {
  const { language, dict } = useApp();
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Poll for status changes so a customer watching the page sees "Ready"
  // without having to reload. Stops once the order reaches a terminal state —
  // polling a finished order is pure waste.
  const isTerminal = ["COMPLETED", "CANCELLED", "REJECTED"].includes(order.status);
  useEffect(() => {
    if (isTerminal) return;
    const interval = setInterval(() => router.refresh(), 15000);
    return () => clearInterval(interval);
  }, [router, isTerminal]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const steps = [
    { key: "received", label: dict.tracking.step1Label, desc: dict.tracking.step1Desc },
    { key: "preparing", label: dict.tracking.step2Label, desc: dict.tracking.step2Desc },
    { key: "ready", label: dict.tracking.step3Label, desc: dict.tracking.step3Desc },
    { key: "completed", label: dict.tracking.step4Label, desc: dict.tracking.step4Desc },
  ].map((step) => ({
    ...step,
    isComplete: REACHED[step.key].includes(order.status),
    isActive:
      (step.key === "preparing" && order.status === "PREPARING") ||
      (step.key === "ready" && order.status === "READY"),
  }));

  const pickupTime = new Date(order.requestedPickupTime).toLocaleTimeString(
    language === "ar" ? "ar-YE" : "en-US",
    { hour: "2-digit", minute: "2-digit" }
  );

  const currency = dict.menu.currency;
  const money = (n: number) => `${n.toLocaleString("en-US")} ${currency}`;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
      {/* Summary */}
      <Card className="p-6 sm:p-8 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-content-muted">
              {dict.tracking.orderNumber}
            </p>
            <h1 className="text-3xl font-bold text-content tabular" dir="ltr">
              {order.orderNumber}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleRefresh}>
              <RotateCw
                className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin")}
                aria-hidden="true"
              />
              <span>{dict.tracking.refresh}</span>
            </Button>
            <OrderStatusBadge status={order.status} language={language} size="lg" />
          </div>
        </div>

        {/* Pickup time — the single most important fact on this page. */}
        <div className="flex items-center gap-3 p-4 rounded-card bg-brand-subtle">
          <span
            className="w-10 h-10 shrink-0 rounded-control bg-brand text-brand-content flex items-center justify-center"
            aria-hidden="true"
          >
            <Clock className="w-5 h-5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs text-content-secondary">
              {dict.tracking.pickupTime}
            </p>
            <p className="text-lg font-bold text-content">
              <span className="tabular">{pickupTime}</span>
              <span className="ms-2 text-sm font-medium text-content-secondary">
                (
                {order.pickupMode === "ASAP"
                  ? dict.tracking.asap
                  : dict.tracking.scheduled}
                )
              </span>
            </p>
          </div>
        </div>

        {order.status === "REJECTED" && (
          <div
            role="alert"
            className="p-4 rounded-card bg-status-danger-bg text-status-danger-fg space-y-1.5"
          >
            <p className="font-semibold flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
              {dict.tracking.rejectedTitle}
            </p>
            <p className="text-sm opacity-90">
              {dict.tracking.rejectedReason}:{" "}
              {order.payment?.rejectReason || dict.tracking.rejectedDefault}
            </p>
            <p className="text-sm font-medium pt-1">{dict.tracking.rejectedHelp}</p>
          </div>
        )}
      </Card>

      {/* Progress */}
      <Card className="p-6 sm:p-8 space-y-5">
        <h2 className="text-sm font-semibold text-content">
          {dict.tracking.stepsTitle}
        </h2>

        <ol className="space-y-1">
          {steps.map((step, idx) => (
            <li key={step.key} className="flex items-start gap-4">
              <div className="flex flex-col items-center self-stretch">
                <span
                  className={cn(
                    "w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
                    step.isComplete
                      ? "bg-brand text-brand-content"
                      : "bg-surface-sunken text-content-muted border border-subtle",
                    step.isActive && "ring-4 ring-brand/20"
                  )}
                >
                  {step.isComplete ? (
                    <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    idx + 1
                  )}
                </span>
                {idx < steps.length - 1 && (
                  <span
                    className={cn(
                      "w-0.5 flex-1 min-h-[2rem] my-1",
                      step.isComplete ? "bg-brand" : "bg-border-subtle"
                    )}
                    aria-hidden="true"
                  />
                )}
              </div>

              <div className="pt-1.5 pb-4">
                <p
                  className={cn(
                    "text-sm font-semibold",
                    step.isComplete ? "text-content" : "text-content-muted"
                  )}
                >
                  {step.label}
                </p>
                <p className="text-sm text-content-secondary mt-0.5">
                  {step.desc}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Card>

      {/* Items */}
      <Card className="p-6 space-y-4">
        <h2 className="text-sm font-semibold text-content pb-3 border-b border-subtle">
          {dict.tracking.itemsTitle}
        </h2>

        <ul className="divide-y divide-subtle">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between items-start gap-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-content">
                  <span className="tabular">{item.quantity}×</span>{" "}
                  {language === "ar" ? item.productNameAr : item.productNameEn}
                </p>
                {item.options.length > 0 && (
                  <p className="text-xs text-content-secondary mt-0.5">
                    {item.options
                      .map((o) => (language === "ar" ? o.nameAr : o.nameEn))
                      .join(" · ")}
                  </p>
                )}
                {item.itemNotes && (
                  <p className="text-xs text-content-muted mt-0.5 italic">
                    &quot;{item.itemNotes}&quot;
                  </p>
                )}
              </div>
              <span className="text-sm font-semibold text-content tabular shrink-0">
                {money(item.subtotal)}
              </span>
            </li>
          ))}
        </ul>

        <div className="flex justify-between items-baseline pt-2">
          <span className="text-base font-semibold text-content">
            {dict.tracking.totalLabel}
          </span>
          <span className="text-xl font-bold text-brand tabular">
            {money(order.total)}
          </span>
        </div>
      </Card>

      {/* Support */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <a
          href={`https://wa.me/967772207788?text=${encodeURIComponent(
            `${dict.tracking.whatsappMessage} ${order.orderNumber}`
          )}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 rounded-control border border-default bg-surface text-sm font-semibold text-content hover:bg-surface-sunken transition-colors"
        >
          <MessageCircle className="w-4 h-4 text-status-ready-fg" aria-hidden="true" />
          {dict.tracking.helpWhatsApp}
        </a>
        <p className="flex items-center gap-1.5 text-xs text-content-muted">
          <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
          {dict.brand.masaken}
        </p>
      </div>
    </div>
  );
}
