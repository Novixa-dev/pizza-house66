"use client";

import React, { useState } from "react";
import { loginStaffAction } from "@/app/actions/orderActions";
import { StaffRole } from "@/lib/auth";
import { ShieldCheck, Lock, ArrowLeft, ArrowRight, AlertCircle, KeyRound } from "lucide-react";
import { useApp } from "@/context/AppContext";

interface StaffAuthModalProps {
  requiredRole: StaffRole;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  onSuccess?: () => void;
}

export default function StaffAuthModal({
  requiredRole,
  titleAr,
  titleEn,
  descriptionAr,
  descriptionEn,
  onSuccess,
}: StaffAuthModalProps) {
  const { language } = useApp();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!pin.trim()) {
      setError(language === "ar" ? "يرجى إدخال الرمز السري." : "Please enter PIN.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await loginStaffAction(pin.trim(), requiredRole);
      if (res.success) {
        if (onSuccess) {
          onSuccess();
        } else {
          window.location.reload();
        }
      } else {
        setError(res.error || "رمز الدخول غير صحيح.");
      }
    } catch {
      setError("حدث خطأ أثناء الاتصال بالخادم.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl max-w-sm w-full p-6 sm:p-8 shadow-2xl space-y-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-pizza-100 dark:bg-pizza-950 text-pizza-600 dark:text-pizza-400 flex items-center justify-center mx-auto shadow-inner">
          <KeyRound className="w-7 h-7" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-xl font-black text-stone-900 dark:text-white font-cairo">
            {language === "ar" ? titleAr : titleEn}
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            {language === "ar" ? descriptionAr : descriptionEn}
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2 text-start">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              inputMode="numeric"
              maxLength={8}
              autoFocus
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••"
              className="w-full text-center text-2xl tracking-[0.5em] py-3.5 px-4 rounded-2xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:border-pizza-600 font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-pizza-700 hover:bg-pizza-800 disabled:opacity-50 text-white py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-pizza-700/20 active:scale-95 transition-all"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>
              {isLoading
                ? language === "ar"
                  ? "جاري التحقق..."
                  : "Verifying..."
                : language === "ar"
                ? "تأكيد الدخول"
                : "Unlock Access"}
            </span>
            {language === "ar" ? (
              <ArrowLeft className="w-3.5 h-3.5" />
            ) : (
              <ArrowRight className="w-3.5 h-3.5" />
            )}
          </button>
        </form>

        <div className="pt-2 border-t border-stone-100 dark:border-stone-800">
          <a
            href="/"
            className="text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors"
          >
            {language === "ar" ? "العودة للرئيسية" : "Back to Home"}
          </a>
        </div>
      </div>
    </div>
  );
}
