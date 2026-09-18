"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Search, Pizza, ArrowLeft, ArrowRight } from "lucide-react";

export default function TrackSearchClientView() {
  const { language, dict } = useApp();
  const [orderQuery, setOrderQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = orderQuery.trim().replace(/^#/, "");
    if (!clean) return;
    window.location.href = `/track/${clean}`;
  };

  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center space-y-6">
      <div className="w-16 h-16 rounded-3xl bg-pizza-100 dark:bg-pizza-950 flex items-center justify-center text-pizza-600 mx-auto shadow-inner">
        <Pizza className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-black text-stone-900 dark:text-white font-cairo">
          {dict.tracking.title}
        </h1>
        <p className="text-xs text-stone-500">
          أدخل رقم الطلب لمعرفة مرحلة الخبز والتجهيز الحالية في الفرع
        </p>
      </div>

      <form onSubmit={handleSearch} className="space-y-3">
        <input
          type="text"
          value={orderQuery}
          onChange={(e) => setOrderQuery(e.target.value)}
          placeholder="مثلاً: PH-1024 أو رقم الطلب"
          className="w-full text-center text-sm p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-850 text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:border-pizza-600 font-outfit"
        />

        <button
          type="submit"
          className="w-full bg-pizza-700 hover:bg-pizza-800 text-white py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-pizza-700/20 active:scale-95 transition-all"
        >
          <span>بحث عن الطلب</span>
          {language === "ar" ? (
            <ArrowLeft className="w-4 h-4" />
          ) : (
            <ArrowRight className="w-4 h-4" />
          )}
        </button>
      </form>
    </div>
  );
}
