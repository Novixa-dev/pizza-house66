"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { createOrderAction } from "@/app/actions/orderActions";
import {
  Clock,
  CalendarCheck,
  CreditCard,
  Building2,
  Upload,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Phone,
  User,
  FileText,
} from "lucide-react";
import { TimeSlotOption } from "@/types";

interface CheckoutClientViewProps {
  restaurant: any;
  availableSlots: TimeSlotOption[];
}

export default function CheckoutClientView({
  restaurant,
  availableSlots,
}: CheckoutClientViewProps) {
  const { cart, cartTotal, clearCart, language, dict } = useApp();

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [pickupMode, setPickupMode] = useState<"ASAP" | "SCHEDULED">("ASAP");
  const [selectedSlot, setSelectedSlot] = useState<string>(
    availableSlots.find((s) => s.isAvailable)?.timeString || ""
  );
  const [paymentMethod, setPaymentMethod] = useState<
    "PAY_AT_PICKUP" | "TRANSFER_KURAIMI" | "TRANSFER_AMQI" | "TRANSFER_BUSAIRI"
  >("PAY_AT_PICKUP");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [receiptBase64, setReceiptBase64] = useState<string>("");
  const [notes, setNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Handle local file selection and convert to Base64 data URI
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("حجم الصورة يجب ألا يتجاوز 5 ميجابايت.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setReceiptBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (cart.length === 0) {
      setErrorMessage(dict.cart.emptyTitle);
      return;
    }

    if (!customerName.trim()) {
      setErrorMessage("يرجى إدخال اسم العميل.");
      return;
    }

    if (!customerPhone.trim()) {
      setErrorMessage("يرجى إدخال رقم الهاتف للتواصل.");
      return;
    }

    if (pickupMode === "SCHEDULED" && !selectedSlot) {
      setErrorMessage("يرجى اختيار وقت الاستلام المفضل.");
      return;
    }

    if (paymentMethod !== "PAY_AT_PICKUP" && !receiptBase64) {
      setErrorMessage("يرجى إرفاق صورة إشعار التحويل لتوثيق الحجز.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
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
      };

      const result = await createOrderAction(payload);

      if (!result.success) {
        setErrorMessage(result.error || "تعذر إتمام الطلب.");
        setIsSubmitting(false);
        return;
      }

      // Success! Clear cart and redirect to order tracking screen
      clearCart();
      window.location.href = `/track/${result.orderId}?token=${result.trackingToken}`;
    } catch (err) {
      console.error("Order submission error:", err);
      setErrorMessage("حدث خطأ أثناء الاتصال بالخادم. يرجى المحاولة مرة أخرى.");
      setIsSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-stone-900 dark:text-white">
          {dict.cart.emptyTitle}
        </h2>
        <p className="text-sm text-stone-500">{dict.cart.emptyDesc}</p>
        <a
          href="/menu"
          className="inline-flex items-center gap-2 bg-pizza-700 text-white px-6 py-3 rounded-2xl font-bold text-sm"
        >
          <span>{dict.cart.continueShopping}</span>
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-white font-cairo">
          {dict.checkout.title}
        </h1>
        <p className="text-xs sm:text-sm text-stone-500">
          فرع فوه - حي المساكن | استلام سريع ومجدول
        </p>
      </div>

      {restaurant?.isOnlineOrderingPaused && (
        <div className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{dict.checkout.orderingPausedAlert}</span>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form Fields */}
        <div className="lg:col-span-7 space-y-8">
          {/* 1. Customer Information */}
          <div className="bg-white dark:bg-stone-850 p-5 sm:p-6 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-2">
              <User className="w-4 h-4 text-pizza-600" />
              <span>{dict.checkout.customerInfo}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                  {dict.checkout.fullName} *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder={dict.checkout.fullNamePlaceholder}
                  className="w-full text-xs sm:text-sm p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:border-pizza-600 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                  {dict.checkout.phone} *
                </label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder={dict.checkout.phonePlaceholder}
                  className="w-full text-xs sm:text-sm p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:border-pizza-600 transition-colors font-outfit"
                />
              </div>
            </div>
          </div>

          {/* 2. Pickup Timing Strategy (The Key Innovation) */}
          <div className="bg-white dark:bg-stone-850 p-5 sm:p-6 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-crust-500" />
              <span>{dict.checkout.timingTitle}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* ASAP Option */}
              <button
                type="button"
                onClick={() => setPickupMode("ASAP")}
                className={`p-4 rounded-2xl border text-start transition-all ${
                  pickupMode === "ASAP"
                    ? "border-pizza-600 bg-pizza-50/70 dark:bg-pizza-950/40 text-pizza-950 dark:text-white shadow-sm"
                    : "border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 bg-white dark:bg-stone-850 text-stone-700 dark:text-stone-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-bold">
                    {dict.checkout.asapLabel}
                  </span>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      pickupMode === "ASAP"
                        ? "border-pizza-600 bg-pizza-600 text-white"
                        : "border-stone-300"
                    }`}
                  >
                    {pickupMode === "ASAP" && <CheckCircle2 className="w-3 h-3" />}
                  </div>
                </div>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
                  {dict.checkout.asapBadge}
                </p>
              </button>

              {/* Scheduled Option */}
              <button
                type="button"
                onClick={() => setPickupMode("SCHEDULED")}
                className={`p-4 rounded-2xl border text-start transition-all ${
                  pickupMode === "SCHEDULED"
                    ? "border-pizza-600 bg-pizza-50/70 dark:bg-pizza-950/40 text-pizza-950 dark:text-white shadow-sm"
                    : "border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 bg-white dark:bg-stone-850 text-stone-700 dark:text-stone-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-bold">
                    {dict.checkout.scheduledLabel}
                  </span>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      pickupMode === "SCHEDULED"
                        ? "border-pizza-600 bg-pizza-600 text-white"
                        : "border-stone-300"
                    }`}
                  >
                    {pickupMode === "SCHEDULED" && <CheckCircle2 className="w-3 h-3" />}
                  </div>
                </div>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
                  حدد وقت وصولك لنجهزها طازجة فوراً
                </p>
              </button>
            </div>

            {/* Slots Grid if Scheduled */}
            {pickupMode === "SCHEDULED" && (
              <div className="pt-3 space-y-2 border-t border-stone-200 dark:border-stone-800">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block">
                  {dict.checkout.selectSlot}
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
                  {availableSlots.map((slot) => (
                    <button
                      type="button"
                      key={slot.timeString}
                      disabled={!slot.isAvailable}
                      onClick={() => setSelectedSlot(slot.timeString)}
                      className={`p-2.5 rounded-xl border text-xs font-bold font-outfit text-center transition-all ${
                        !slot.isAvailable
                          ? "opacity-35 cursor-not-allowed bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-400"
                          : selectedSlot === slot.timeString
                          ? "bg-pizza-700 text-white border-pizza-700 shadow-sm"
                          : "bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-pizza-500"
                      }`}
                    >
                      <div>
                        {language === "ar"
                          ? slot.displayLabelAr
                          : slot.displayLabelEn}
                      </div>
                      {!slot.isAvailable && (
                        <span className="text-[9px] block text-red-500 font-cairo mt-0.5">
                          {slot.reason || dict.checkout.slotFull}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 3. Payment Method */}
          <div className="bg-white dark:bg-stone-850 p-5 sm:p-6 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <span>{dict.checkout.paymentTitle}</span>
            </h3>

            <div className="space-y-3">
              {/* Pay at Pickup */}
              <label className="p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-800/40 flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "PAY_AT_PICKUP"}
                  onChange={() => setPaymentMethod("PAY_AT_PICKUP")}
                  className="mt-1 text-pizza-600 focus:ring-pizza-500"
                />
                <div>
                  <span className="text-xs sm:text-sm font-bold text-stone-900 dark:text-white block">
                    {dict.checkout.payAtPickup}
                  </span>
                  <span className="text-[11px] text-stone-500 block mt-0.5">
                    {dict.checkout.payAtPickupDesc}
                  </span>
                </div>
              </label>

              {/* Kuraimi Transfer */}
              <label className="p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-800/40 flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "TRANSFER_KURAIMI"}
                  onChange={() => setPaymentMethod("TRANSFER_KURAIMI")}
                  className="mt-1 text-pizza-600 focus:ring-pizza-500"
                />
                <div>
                  <span className="text-xs sm:text-sm font-bold text-stone-900 dark:text-white block">
                    تحويل عبر بنك الكريمي (حاسب / إم فلوس)
                  </span>
                  <span className="text-[11px] text-stone-500 block mt-0.5">
                    {dict.checkout.kuraimiAcc}
                  </span>
                </div>
              </label>

              {/* Al-Amqi Transfer */}
              <label className="p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-800/40 flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "TRANSFER_AMQI"}
                  onChange={() => setPaymentMethod("TRANSFER_AMQI")}
                  className="mt-1 text-pizza-600 focus:ring-pizza-500"
                />
                <div>
                  <span className="text-xs sm:text-sm font-bold text-stone-900 dark:text-white block">
                    تحويل عبر شركة العمقي للصرافة
                  </span>
                  <span className="text-[11px] text-stone-500 block mt-0.5">
                    {dict.checkout.amqiAcc}
                  </span>
                </div>
              </label>

              {/* Al-Busairi Transfer */}
              <label className="p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-800/40 flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "TRANSFER_BUSAIRI"}
                  onChange={() => setPaymentMethod("TRANSFER_BUSAIRI")}
                  className="mt-1 text-pizza-600 focus:ring-pizza-500"
                />
                <div>
                  <span className="text-xs sm:text-sm font-bold text-stone-900 dark:text-white block">
                    تحويل عبر شركة البسيري للصرافة
                  </span>
                  <span className="text-[11px] text-stone-500 block mt-0.5">
                    {dict.checkout.busairiAcc}
                  </span>
                </div>
              </label>
            </div>

            {/* Receipt Upload Box if Transfer is selected */}
            {paymentMethod !== "PAY_AT_PICKUP" && (
              <div className="pt-4 border-t border-stone-200 dark:border-stone-800 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block">
                    {dict.checkout.uploadReceipt} *
                  </label>
                  <div className="border-2 border-dashed border-stone-300 dark:border-stone-700 rounded-2xl p-4 text-center hover:border-pizza-500 transition-colors bg-stone-50 dark:bg-stone-800/50">
                    <input
                      type="file"
                      id="receiptFile"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="receiptFile"
                      className="cursor-pointer flex flex-col items-center gap-2"
                    >
                      <Upload className="w-6 h-6 text-pizza-600" />
                      <span className="text-xs font-bold text-stone-800 dark:text-stone-200">
                        {receiptBase64
                          ? "تم اختيار صورة الإشعار (انقر للتغيير)"
                          : dict.checkout.chooseFile}
                      </span>
                      <span className="text-[10px] text-stone-400">
                        الحد الأقصى 5 ميجابايت (JPG, PNG)
                      </span>
                    </label>

                    {receiptBase64 && (
                      <div className="mt-3 inline-block relative rounded-xl overflow-hidden border border-stone-300 max-h-32">
                        <img
                          src={receiptBase64}
                          alt="Receipt Preview"
                          className="h-32 object-contain"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                    {dict.checkout.referenceNumber}
                  </label>
                  <input
                    type="text"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    placeholder={dict.checkout.referencePlaceholder}
                    className="w-full text-xs sm:text-sm p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white placeholder:text-stone-400 font-outfit"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 4. Optional Order Notes */}
          <div className="bg-white dark:bg-stone-850 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-2">
            <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-stone-400" />
              <span>{dict.checkout.notes}</span>
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={dict.checkout.notesPlaceholder}
              className="w-full text-xs p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white placeholder:text-stone-400"
            />
          </div>
        </div>

        {/* Right Column: Order Summary & Place Order Action */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-stone-850 p-5 sm:p-6 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-4 sticky top-24">
            <h3 className="text-base font-bold text-stone-900 dark:text-white border-b border-stone-200 dark:border-stone-800 pb-3">
              ملخص طلبك ({cart.length} أصناف)
            </h3>

            {/* Items scroll */}
            <div className="space-y-3 max-h-64 overflow-y-auto pe-1">
              {cart.map((item) => (
                <div
                  key={item.cartItemId}
                  className="flex justify-between items-start text-xs border-b border-stone-100 dark:border-stone-800/60 pb-2"
                >
                  <div>
                    <span className="font-bold text-stone-900 dark:text-white">
                      {item.quantity}x {language === "ar" ? item.nameAr : item.nameEn}
                    </span>
                    {item.selectedOptions?.length > 0 && (
                      <p className="text-[10px] text-stone-400 mt-0.5">
                        {item.selectedOptions
                          .map((o) => (language === "ar" ? o.optionNameAr : o.optionNameEn))
                          .join(" • ")}
                      </p>
                    )}
                  </div>
                  <span className="font-outfit font-black text-stone-800 dark:text-stone-200">
                    {item.subtotal.toLocaleString()} {dict.menu.currency}
                  </span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="pt-2 space-y-2 border-t border-stone-200 dark:border-stone-800 text-xs">
              <div className="flex justify-between text-stone-500">
                <span>المجموع الفرعي:</span>
                <span className="font-outfit font-bold">
                  {cartTotal.toLocaleString()} {dict.menu.currency}
                </span>
              </div>
              <div className="flex justify-between text-base font-black text-stone-900 dark:text-white pt-2 border-t border-stone-200 dark:border-stone-800">
                <span>الإجمالي للدفع:</span>
                <span className="text-xl text-pizza-700 dark:text-pizza-400 font-outfit">
                  {cartTotal.toLocaleString()} {dict.menu.currency}
                </span>
              </div>
            </div>

            {/* Submit CTA */}
            <button
              type="submit"
              disabled={isSubmitting || restaurant?.isOnlineOrderingPaused}
              className={`w-full py-3.5 px-5 rounded-2xl font-bold text-sm shadow-xl active:scale-[0.99] transition-all flex items-center justify-center gap-2 ${
                isSubmitting || restaurant?.isOnlineOrderingPaused
                  ? "bg-stone-300 dark:bg-stone-700 text-stone-500 cursor-not-allowed shadow-none"
                  : "bg-gradient-to-r from-pizza-700 via-pizza-600 to-pizza-700 hover:from-pizza-800 hover:to-pizza-800 text-white shadow-pizza-700/25"
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>جاري تأكيد وتسجيل الطلب...</span>
                </span>
              ) : (
                <>
                  <span>{dict.checkout.placeOrder}</span>
                  {language === "ar" ? (
                    <ArrowLeft className="w-4 h-4" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
