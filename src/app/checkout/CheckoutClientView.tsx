"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { createOrderAction } from "@/app/actions/orderActions";
import {
  Clock,
  CreditCard,
  Upload,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  User,
  FileText,
  ShoppingBag,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Card, EmptyState } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { TimeSlotOption, PaymentMethod } from "@/types";

interface CheckoutClientViewProps {
  restaurant: { isOnlineOrderingPaused: boolean } | null;
  availableSlots: TimeSlotOption[];
}

const MAX_RECEIPT_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

/** Shared input styling. Kept here so every field on the page matches. */
const inputClass =
  "w-full min-h-[44px] px-3.5 py-2.5 text-sm rounded-control " +
  "border border-default bg-surface text-content " +
  "placeholder:text-content-muted transition-colors focus:border-brand";

export default function CheckoutClientView({
  restaurant,
  availableSlots,
}: CheckoutClientViewProps) {
  const { cart, cartTotal, clearCart, language, dict } = useApp();

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [pickupMode, setPickupMode] = useState<"ASAP" | "SCHEDULED">("ASAP");
  const [selectedSlot, setSelectedSlot] = useState<string>(
    availableSlots.find((s) => s.isAvailable)?.timeString ?? ""
  );
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("PAY_AT_PICKUP");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [receiptBase64, setReceiptBase64] = useState("");
  const [notes, setNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const DirectionalArrow = language === "ar" ? ArrowLeft : ArrowRight;
  const isPaused = restaurant?.isOnlineOrderingPaused ?? false;
  const currency = dict.menu.currency;
  const money = (n: number) => `${n.toLocaleString("en-US")} ${currency}`;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMessage(null);

    // Both checks are re-applied on the server; these only give fast feedback.
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setErrorMessage(dict.checkout.errFileType);
      e.target.value = "";
      return;
    }
    if (file.size > MAX_RECEIPT_BYTES) {
      setErrorMessage(dict.checkout.errFileTooLarge);
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setReceiptBase64(reader.result as string);
    reader.onerror = () => setErrorMessage(dict.checkout.errGeneric);
    reader.readAsDataURL(file);
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    // Guard against a double submit racing past the disabled button.
    if (isSubmitting) return;
    setErrorMessage(null);

    if (cart.length === 0) return setErrorMessage(dict.cart.emptyTitle);
    if (!customerName.trim()) return setErrorMessage(dict.checkout.errNameRequired);
    if (!customerPhone.trim()) return setErrorMessage(dict.checkout.errPhoneRequired);
    if (pickupMode === "SCHEDULED" && !selectedSlot) {
      return setErrorMessage(dict.checkout.errSlotRequired);
    }
    if (paymentMethod !== "PAY_AT_PICKUP" && !receiptBase64) {
      return setErrorMessage(dict.checkout.errReceiptRequired);
    }

    setIsSubmitting(true);
    try {
      const result = await createOrderAction({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        pickupMode,
        requestedTime: pickupMode === "SCHEDULED" ? selectedSlot : undefined,
        paymentMethod,
        referenceNumber: referenceNumber.trim() || undefined,
        receiptUrl: receiptBase64 || undefined,
        notes: notes.trim() || undefined,
        items: cart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          selectedOptionIds: item.selectedOptions.map((o) => o.optionId),
          notes: item.notes,
        })),
      });

      if (!result.success) {
        setErrorMessage(result.error || dict.checkout.errGeneric);
        setIsSubmitting(false);
        return;
      }

      clearCart();
      // id + token together form the capability that opens the tracking page.
      window.location.href = `/track/${result.orderId}?token=${result.trackingToken}`;
    } catch {
      setErrorMessage(dict.checkout.errNetwork);
      setIsSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20">
        <EmptyState
          icon={ShoppingBag}
          title={dict.cart.emptyTitle}
          description={dict.cart.emptyDesc}
          action={
            <Button
              variant="primary"
              onClick={() => (window.location.href = "/menu")}
            >
              {dict.cart.continueShopping}
            </Button>
          }
        />
      </div>
    );
  }

  const paymentOptions: { value: PaymentMethod; label: string; desc: string }[] = [
    {
      value: "PAY_AT_PICKUP",
      label: dict.checkout.payAtPickup,
      desc: dict.checkout.payAtPickupDesc,
    },
    { value: "TRANSFER_KURAIMI", label: dict.checkout.kuraimiLabel, desc: dict.checkout.kuraimiAcc },
    { value: "TRANSFER_AMQI", label: dict.checkout.amqiLabel, desc: dict.checkout.amqiAcc },
    { value: "TRANSFER_BUSAIRI", label: dict.checkout.busairiLabel, desc: dict.checkout.busairiAcc },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <header className="text-center space-y-2 mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-content">
          {dict.checkout.title}
        </h1>
        <p className="text-sm text-content-secondary">{dict.checkout.subtitle}</p>
      </header>

      {isPaused && (
        <div
          role="status"
          className="mb-6 p-4 rounded-card bg-status-danger-bg text-status-danger-fg text-sm flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{dict.checkout.orderingPausedAlert}</span>
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          className="mb-6 p-4 rounded-card bg-status-danger-bg text-status-danger-fg text-sm flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form
        onSubmit={handleSubmitOrder}
        className="grid grid-cols-1 lg:grid-cols-12 gap-6"
        noValidate
      >
        <div className="lg:col-span-7 space-y-6">
          {/* Customer */}
          <Card className="p-5 sm:p-6 space-y-4">
            <h2 className="text-sm font-semibold text-content flex items-center gap-2">
              <User className="w-4 h-4 text-content-muted" aria-hidden="true" />
              {dict.checkout.customerInfo}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="co-name" className="block text-sm font-medium text-content">
                  {dict.checkout.fullName}
                </label>
                <input
                  id="co-name"
                  type="text"
                  required
                  autoComplete="name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder={dict.checkout.fullNamePlaceholder}
                  className={inputClass}
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="co-phone" className="block text-sm font-medium text-content">
                  {dict.checkout.phone}
                </label>
                <input
                  id="co-phone"
                  type="tel"
                  required
                  inputMode="tel"
                  autoComplete="tel"
                  dir="ltr"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder={dict.checkout.phonePlaceholder}
                  className={cn(inputClass, "tabular")}
                />
              </div>
            </div>
          </Card>

          {/* Pickup timing — the product's core idea. */}
          <Card className="p-5 sm:p-6 space-y-4">
            <h2 className="text-sm font-semibold text-content flex items-center gap-2">
              <Clock className="w-4 h-4 text-content-muted" aria-hidden="true" />
              {dict.checkout.timingTitle}
            </h2>

            <div
              role="radiogroup"
              aria-label={dict.checkout.timingTitle}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
            >
              {(
                [
                  { mode: "ASAP" as const, label: dict.checkout.asapLabel, desc: dict.checkout.asapBadge },
                  { mode: "SCHEDULED" as const, label: dict.checkout.scheduledLabel, desc: dict.checkout.scheduledDesc },
                ]
              ).map(({ mode, label, desc }) => {
                const isSelected = pickupMode === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setPickupMode(mode)}
                    className={cn(
                      "p-4 rounded-card border text-start transition-colors",
                      isSelected
                        ? "border-brand bg-brand-subtle"
                        : "border-default bg-surface hover:bg-surface-sunken"
                    )}
                  >
                    <span
                      className={cn(
                        "block text-sm font-semibold",
                        isSelected ? "text-brand" : "text-content"
                      )}
                    >
                      {label}
                    </span>
                    <span className="block text-xs text-content-secondary mt-1">
                      {desc}
                    </span>
                  </button>
                );
              })}
            </div>

            {pickupMode === "SCHEDULED" && (
              <div className="pt-4 space-y-2 border-t border-subtle">
                <p id="slot-label" className="text-sm font-medium text-content">
                  {dict.checkout.selectSlot}
                </p>

                {availableSlots.length === 0 ? (
                  <p className="text-sm text-content-secondary py-4">
                    {dict.checkout.noSlots}
                  </p>
                ) : (
                  <div
                    role="radiogroup"
                    aria-labelledby="slot-label"
                    className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto p-0.5"
                  >
                    {availableSlots.map((slot) => {
                      const isSelected = selectedSlot === slot.timeString;
                      return (
                        <button
                          key={slot.timeString}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          disabled={!slot.isAvailable}
                          onClick={() => setSelectedSlot(slot.timeString)}
                          className={cn(
                            "px-2 py-2.5 min-h-[44px] rounded-control border text-xs font-semibold text-center transition-colors",
                            !slot.isAvailable
                              ? "bg-surface-sunken border-subtle text-content-muted cursor-not-allowed opacity-60"
                              : isSelected
                                ? "bg-brand text-brand-content border-brand"
                                : "bg-surface border-default text-content hover:bg-surface-sunken"
                          )}
                        >
                          <span className="block tabular">
                            {language === "ar" ? slot.displayLabelAr : slot.displayLabelEn}
                          </span>
                          {!slot.isAvailable && (
                            <span className="block text-2xs font-normal mt-0.5">
                              {slot.reason || dict.checkout.slotFull}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Payment */}
          <Card className="p-5 sm:p-6 space-y-4">
            <h2 className="text-sm font-semibold text-content flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-content-muted" aria-hidden="true" />
              {dict.checkout.paymentTitle}
            </h2>

            <div className="space-y-2">
              {paymentOptions.map((option) => {
                const isSelected = paymentMethod === option.value;
                return (
                  <label
                    key={option.value}
                    className={cn(
                      "flex items-start gap-3 p-3.5 rounded-card border cursor-pointer transition-colors",
                      isSelected
                        ? "border-brand bg-brand-subtle"
                        : "border-default bg-surface hover:bg-surface-sunken"
                    )}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={option.value}
                      checked={isSelected}
                      onChange={() => setPaymentMethod(option.value)}
                      className="mt-1 w-4 h-4 accent-[rgb(var(--brand))]"
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-content">
                        {option.label}
                      </span>
                      <span className="block text-xs text-content-secondary mt-0.5">
                        {option.desc}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>

            {paymentMethod !== "PAY_AT_PICKUP" && (
              <div className="pt-4 border-t border-subtle space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-content">
                    {dict.checkout.uploadReceipt}
                  </p>
                  <div className="rounded-card border border-dashed border-default bg-surface-sunken p-5 text-center transition-colors hover:border-strong">
                    <input
                      type="file"
                      id="receiptFile"
                      accept={ACCEPTED_TYPES.join(",")}
                      onChange={handleFileChange}
                      className="sr-only"
                    />
                    <label
                      htmlFor="receiptFile"
                      className="cursor-pointer flex flex-col items-center gap-2"
                    >
                      <Upload className="w-6 h-6 text-content-muted" aria-hidden="true" />
                      <span className="text-sm font-semibold text-content">
                        {receiptBase64
                          ? dict.checkout.receiptChosen
                          : dict.checkout.chooseFile}
                      </span>
                      <span className="text-xs text-content-muted">
                        {dict.checkout.receiptHint}
                      </span>
                    </label>

                    {receiptBase64 && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={receiptBase64}
                        alt={dict.checkout.receiptPreviewAlt}
                        className="mt-4 mx-auto h-32 object-contain rounded-control border border-subtle"
                      />
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="co-ref" className="block text-sm font-medium text-content">
                    {dict.checkout.referenceNumber}
                  </label>
                  <input
                    id="co-ref"
                    type="text"
                    dir="ltr"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    placeholder={dict.checkout.referencePlaceholder}
                    className={cn(inputClass, "tabular")}
                  />
                </div>
              </div>
            )}
          </Card>

          {/* Notes */}
          <Card className="p-5 space-y-2">
            <label
              htmlFor="co-notes"
              className="flex items-center gap-1.5 text-sm font-medium text-content"
            >
              <FileText className="w-4 h-4 text-content-muted" aria-hidden="true" />
              {dict.checkout.notes}
            </label>
            <input
              id="co-notes"
              type="text"
              maxLength={500}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={dict.checkout.notesPlaceholder}
              className={inputClass}
            />
          </Card>
        </div>

        {/* Summary */}
        <div className="lg:col-span-5">
          <Card className="p-5 sm:p-6 space-y-4 lg:sticky lg:top-24">
            <h2 className="text-base font-semibold text-content pb-3 border-b border-subtle">
              {dict.checkout.summaryTitle}
              <span className="ms-2 text-sm font-normal text-content-secondary tabular">
                ({cart.length} {dict.checkout.itemCount})
              </span>
            </h2>

            <ul className="divide-y divide-subtle max-h-64 overflow-y-auto">
              {cart.map((item) => (
                <li
                  key={item.cartItemId}
                  className="flex justify-between items-start gap-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-content">
                      <span className="tabular">{item.quantity}×</span>{" "}
                      {language === "ar" ? item.nameAr : item.nameEn}
                    </p>
                    {item.selectedOptions.length > 0 && (
                      <p className="text-xs text-content-muted mt-0.5">
                        {item.selectedOptions
                          .map((o) =>
                            language === "ar" ? o.optionNameAr : o.optionNameEn
                          )
                          .join(" · ")}
                      </p>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-content tabular shrink-0">
                    {money(item.subtotal)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="pt-3 space-y-2 border-t border-subtle">
              <div className="flex justify-between text-sm text-content-secondary">
                <span>{dict.checkout.subtotalLabel}</span>
                <span className="tabular">{money(cartTotal)}</span>
              </div>
              <div className="flex justify-between items-baseline pt-2 border-t border-subtle">
                <span className="text-base font-semibold text-content">
                  {dict.checkout.totalLabel}
                </span>
                <span className="text-xl font-bold text-brand tabular">
                  {money(cartTotal)}
                </span>
              </div>
              {/* The server recalculates every figure above from the database;
                  these are a preview, not the authority. */}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isSubmitting}
              disabled={isPaused}
            >
              <span>
                {isSubmitting ? dict.checkout.submitting : dict.checkout.placeOrder}
              </span>
              {!isSubmitting && (
                <DirectionalArrow className="w-4 h-4" aria-hidden="true" />
              )}
            </Button>
          </Card>
        </div>
      </form>
    </div>
  );
}
