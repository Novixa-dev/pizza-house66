"use client";

import React from "react";
import { useApp } from "@/context/AppContext";
import { Plus, Flame, Star, Sparkles } from "lucide-react";
import { CustomizerProduct } from "./CustomizerModal";

interface MenuCardProps {
  product: CustomizerProduct;
  onCustomize: (product: CustomizerProduct) => void;
}

export default function MenuCard({ product, onCustomize }: MenuCardProps) {
  const { language, dict } = useApp();

  return (
    <div className="group bg-white dark:bg-stone-850 rounded-3xl overflow-hidden border border-stone-200/80 dark:border-stone-800/80 hover:border-pizza-500/40 dark:hover:border-pizza-500/40 hover:shadow-xl hover:shadow-pizza-950/5 transition-all duration-300 flex flex-col justify-between">
      <div>
        {/* Image Container */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-100 dark:bg-stone-800">
          <img
            src={product.imageUrl}
            alt={language === "ar" ? product.nameAr : product.nameEn}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Badges */}
          <div className="absolute top-3 start-3 flex flex-col gap-1.5">
            {!product.isAvailable ? (
              <span className="bg-stone-900/90 text-red-300 backdrop-blur-md text-[10px] font-bold px-2.5 py-1 rounded-full border border-red-800/40 shadow-sm">
                {dict.menu.soldOut}
              </span>
            ) : product.basePrice >= 5000 ? (
              <span className="bg-gradient-to-r from-amber-500 to-crust-500 text-stone-950 text-[10px] font-black px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
                <Star className="w-3 h-3 fill-stone-950" />
                <span>{dict.menu.featured}</span>
              </span>
            ) : null}
          </div>
        </div>

        {/* Info */}
        <div className="p-4 sm:p-5 space-y-2">
          <h3 className="text-base sm:text-lg font-bold text-stone-900 dark:text-white group-hover:text-pizza-700 dark:group-hover:text-pizza-400 transition-colors font-cairo">
            {language === "ar" ? product.nameAr : product.nameEn}
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2 leading-relaxed">
            {language === "ar" ? product.descriptionAr : product.descriptionEn}
          </p>
        </div>
      </div>

      {/* Footer / Price & CTA */}
      <div className="p-4 sm:p-5 pt-0 flex items-center justify-between border-t border-stone-100 dark:border-stone-800/60 mt-2">
        <div>
          <span className="text-[11px] text-stone-400 block font-cairo">
            {dict.menu.fromPrice}
          </span>
          <div className="text-lg font-black text-stone-900 dark:text-white font-outfit">
            {product.basePrice.toLocaleString()}{" "}
            <span className="text-xs font-semibold text-pizza-700 dark:text-pizza-400 font-cairo">
              {dict.menu.currency}
            </span>
          </div>
        </div>

        <button
          onClick={() => onCustomize(product)}
          disabled={!product.isAvailable}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 ${
            product.isAvailable
              ? "bg-pizza-700 hover:bg-pizza-800 text-white shadow-pizza-700/20"
              : "bg-stone-200 dark:bg-stone-800 text-stone-400 cursor-not-allowed shadow-none"
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{dict.menu.customize}</span>
        </button>
      </div>
    </div>
  );
}
