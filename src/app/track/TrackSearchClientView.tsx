"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Pizza, AlertCircle, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { lookupOrderAction } from "@/app/actions/trackingActions";

export default function TrackSearchClientView() {
  const { language, dict } = useApp();
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const DirectionalArrow = language === "ar" ? ArrowLeft : ArrowRight;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setError(null);

    if (!orderNumber.trim() || !phone.trim()) {
      setError(dict.tracking.lookupInvalid);
      return;
    }

    setIsSubmitting(true);
    const result = await lookupOrderAction(orderNumber, phone);

    if (result.success && result.orderId && result.token) {
      // The id + token pair is the capability that unlocks the order.
      window.location.href = `/track/${result.orderId}?token=${result.token}`;
      return;
    }

    setError(
      result.error === "INVALID_INPUT"
        ? dict.tracking.lookupInvalid
        : dict.tracking.lookupNotFound
    );
    setIsSubmitting(false);
  };

  const inputClass =
    "w-full min-h-[44px] px-3.5 py-2.5 rounded-control border border-default " +
    "bg-surface text-content placeholder:text-content-muted transition-colors " +
    "focus:border-brand";

  return (
    <div className="max-w-md mx-auto px-4 py-16 sm:py-20 space-y-6">
      <div className="text-center space-y-3">
        <span
          className="w-14 h-14 rounded-card bg-brand-subtle text-brand flex items-center justify-center mx-auto"
          aria-hidden="true"
        >
          <Pizza className="w-7 h-7" />
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-content">
          {dict.tracking.title}
        </h1>
        <p className="text-sm text-content-secondary">
          {dict.tracking.lookupSubtitle}
        </p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSearch} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <label
              htmlFor="track-order-number"
              className="block text-sm font-medium text-content"
            >
              {dict.tracking.lookupOrderLabel}
            </label>
            <input
              id="track-order-number"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder={dict.tracking.lookupOrderPlaceholder}
              className={`${inputClass} tabular`}
              dir="ltr"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="track-phone"
              className="block text-sm font-medium text-content"
            >
              {dict.tracking.lookupPhoneLabel}
            </label>
            <input
              id="track-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={dict.tracking.lookupPhonePlaceholder}
              className={`${inputClass} tabular`}
              dir="ltr"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="flex items-start gap-2 text-sm text-status-danger-fg"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              {error}
            </p>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isSubmitting}
          >
            <span>{dict.tracking.lookupSubmit}</span>
            {!isSubmitting && (
              <DirectionalArrow className="w-4 h-4" aria-hidden="true" />
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
}
