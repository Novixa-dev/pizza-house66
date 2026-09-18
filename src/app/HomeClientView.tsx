"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import {
  Clock,
  MapPin,
  Phone,
  Flame,
  CheckCircle2,
  CalendarCheck,
  CreditCard,
  ShieldCheck,
  ArrowLeft,
  ArrowRight,
  Pizza,
  Sparkles,
} from "lucide-react";
import MenuCard from "@/components/customer/MenuCard";
import CustomizerModal, {
  CustomizerProduct,
} from "@/components/customer/CustomizerModal";

interface HomeClientViewProps {
  restaurant: any;
  featuredProducts: any[];
  categories: any[];
}

export default function HomeClientView({
  restaurant,
  featuredProducts,
  categories,
}: HomeClientViewProps) {
  const { language, dict } = useApp();
  const [selectedProduct, setSelectedProduct] = useState<CustomizerProduct | null>(null);

  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-stone-100 to-white dark:from-stone-900/60 dark:to-stone-950 py-12 sm:py-20 border-b border-stone-200/60 dark:border-stone-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
            {/* Text & Pitch */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-start">
              {/* Branch Landmark Pill */}
              <div className="inline-flex items-center gap-2 bg-pizza-50 dark:bg-pizza-950/80 border border-pizza-200 dark:border-pizza-800/60 px-3.5 py-1.5 rounded-full text-xs font-bold text-pizza-800 dark:text-pizza-300 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-pizza-600 animate-ping" />
                <MapPin className="w-3.5 h-3.5 text-pizza-600" />
                <span>المكلا - فوه - حي المساكن</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-stone-900 dark:text-white leading-[1.18] tracking-tight font-cairo">
                {dict.hero.title}
              </h1>

              <p className="text-sm sm:text-base text-stone-600 dark:text-stone-300 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                {dict.hero.subtitle}
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                <a
                  href="/menu"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-gradient-to-r from-pizza-700 via-pizza-600 to-pizza-700 hover:from-pizza-800 hover:to-pizza-800 text-white px-7 py-4 rounded-2xl text-base font-bold shadow-xl shadow-pizza-700/25 active:scale-95 transition-all"
                >
                  <span>{dict.hero.primaryCta}</span>
                  {language === "ar" ? (
                    <ArrowLeft className="w-5 h-5" />
                  ) : (
                    <ArrowRight className="w-5 h-5" />
                  )}
                </a>

                <a
                  href="#featured"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white dark:bg-stone-850 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 px-6 py-4 rounded-2xl text-sm font-bold border border-stone-200 dark:border-stone-700 shadow-sm transition-colors"
                >
                  <Flame className="w-4 h-4 text-pizza-600" />
                  <span>{dict.hero.secondaryCta}</span>
                </a>
              </div>

              {/* Trust Indicators */}
              <div className="pt-4 border-t border-stone-200/60 dark:border-stone-800 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-stone-500">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>استلام فوري بدون طوابير</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>دعم تحويل كريمي والعمقي والبسيري</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>عجينة طازجة مخبوزة على الحجر</span>
                </span>
              </div>
            </div>

            {/* Visual Media Card */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-pizza-950/20 border-4 border-white dark:border-stone-800 aspect-[4/3] sm:aspect-square">
                <img
                  src="https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1000&q=85"
                  alt="Pizza House Mukalla artisan pizza"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                {/* Floating pill: Scheduled Preparation Callout */}
                <div className="absolute bottom-4 start-4 end-4 bg-stone-900/90 backdrop-blur-md text-white p-3.5 rounded-2xl border border-stone-700/60 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-pizza-600 flex items-center justify-center text-amber-300">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold font-cairo">
                        نظام التجهيز المجدول
                      </h4>
                      <p className="text-[11px] text-stone-300">
                        اطلب الساعة 4:00 عصراً واستلم 8:00 مساءً ساخناً
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black bg-amber-400 text-stone-950 px-2 py-1 rounded-lg font-outfit uppercase">
                    Smart KDS
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Three Value Pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          <div className="bg-white dark:bg-stone-850 p-6 sm:p-8 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-sm hover:border-pizza-500/30 transition-colors space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-pizza-100 dark:bg-pizza-950/60 flex items-center justify-center text-pizza-700 dark:text-pizza-400">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-stone-900 dark:text-white font-cairo">
              {dict.hero.feature1Title}
            </h3>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
              {dict.hero.feature1Desc}
            </p>
          </div>

          <div className="bg-white dark:bg-stone-850 p-6 sm:p-8 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-sm hover:border-pizza-500/30 transition-colors space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-700 dark:text-amber-400">
              <Pizza className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-stone-900 dark:text-white font-cairo">
              {dict.hero.feature2Title}
            </h3>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
              {dict.hero.feature2Desc}
            </p>
          </div>

          <div className="bg-white dark:bg-stone-850 p-6 sm:p-8 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-sm hover:border-pizza-500/30 transition-colors space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
              <CreditCard className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-stone-900 dark:text-white font-cairo">
              {dict.hero.feature3Title}
            </h3>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
              {dict.hero.feature3Desc}
            </p>
          </div>
        </div>
      </section>

      {/* 3. Featured Best-Selling Pizzas */}
      <section id="featured" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-pizza-600 dark:text-pizza-400 uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>مختارات بيتزا هاوس المفضلة</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-white font-cairo">
              أشهر أطباق البيتزا والفطائر
            </h2>
          </div>

          <a
            href="/menu"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-pizza-700 dark:text-pizza-400 hover:text-pizza-800"
          >
            <span>عرض القائمة الكاملة</span>
            {language === "ar" ? (
              <ArrowLeft className="w-4 h-4" />
            ) : (
              <ArrowRight className="w-4 h-4" />
            )}
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredProducts.map((product) => (
            <MenuCard
              key={product.id}
              product={product}
              onCustomize={(prod) => setSelectedProduct(prod)}
            />
          ))}
        </div>
      </section>

      {/* 4. Verified Branch Location & Hours Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-stone-900 via-stone-850 to-stone-900 text-white rounded-3xl p-6 sm:p-10 border border-stone-800 shadow-xl relative overflow-hidden">
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <span className="text-xs bg-pizza-600 text-white font-bold px-3 py-1 rounded-full uppercase tracking-wider font-outfit">
                Fuwa Branch • فرع فوه
              </span>
              <h3 className="text-2xl sm:text-3xl font-black font-cairo">
                تفضل بزيارتنا في فوه - حي المساكن
              </h3>
              <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
                يقع المطعم في موقع استراتيجي بالقرب من جامعة الأحقاف، مستوصف النور، ومدرسة السلال. تتوفر جلسات مريحة وخدمة استلام سريعة مسبقة الدفع والتجهيز.
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <a
                  href="tel:05375561"
                  className="inline-flex items-center gap-2 bg-stone-800 hover:bg-stone-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl border border-stone-700 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-pizza-400" />
                  <span>05375561</span>
                </a>
                <a
                  href="https://wa.me/967772207788"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 bg-emerald-900/60 hover:bg-emerald-900 text-emerald-300 text-xs font-bold px-4 py-2.5 rounded-xl border border-emerald-700/60 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>واتساب: 772207788</span>
                </a>
              </div>
            </div>

            <div className="bg-stone-800/80 p-5 rounded-2xl border border-stone-700/60 space-y-3">
              <h4 className="text-xs font-bold text-crust-400 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>جدول الدوام المعتمد</span>
              </h4>
              <div className="space-y-2 text-xs text-stone-300">
                <div className="flex justify-between border-b border-stone-700/60 pb-1.5">
                  <span>الفترة الصباحية (معجنات وفطائر):</span>
                  <span className="font-outfit text-white">8:00 AM – 12:00 PM</span>
                </div>
                <div className="flex justify-between border-b border-stone-700/60 pb-1.5">
                  <span>الفترة المسائية (بيتزا وعشاء):</span>
                  <span className="font-outfit text-white">4:00 PM – 11:30 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>الجمعة (مساءً فقط):</span>
                  <span className="font-outfit text-white">4:00 PM – 11:30 PM</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Customizer Modal */}
      {selectedProduct && (
        <CustomizerModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
}
