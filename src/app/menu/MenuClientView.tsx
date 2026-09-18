"use client";

import React, { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { Search, Pizza, Sparkles, Filter } from "lucide-react";
import MenuCard from "@/components/customer/MenuCard";
import CustomizerModal, {
  CustomizerProduct,
} from "@/components/customer/CustomizerModal";

interface CategoryWithProducts {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  products: any[];
}

interface MenuClientViewProps {
  categories: CategoryWithProducts[];
}

export default function MenuClientView({ categories }: MenuClientViewProps) {
  const { language, dict } = useApp();

  const [activeCategorySlug, setActiveCategorySlug] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<CustomizerProduct | null>(null);

  // Flatten and filter products
  const allProducts = useMemo(() => {
    return categories.flatMap((cat) =>
      cat.products.map((p) => ({ ...p, categorySlug: cat.slug }))
    );
  }, [categories]);

  const filteredProducts = useMemo(() => {
    return allProducts.filter((product) => {
      const matchesCategory =
        activeCategorySlug === "all" || product.categorySlug === activeCategorySlug;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        product.nameAr.toLowerCase().includes(q) ||
        product.nameEn.toLowerCase().includes(q) ||
        product.descriptionAr.toLowerCase().includes(q) ||
        product.descriptionEn.toLowerCase().includes(q);

      return matchesCategory && matchesSearch;
    });
  }, [allProducts, activeCategorySlug, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-black text-stone-900 dark:text-white font-cairo">
          {dict.menu.title}
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
          {dict.menu.subtitle}
        </p>
      </div>

      {/* Search Bar */}
      <div className="max-w-md mx-auto relative">
        <Search className="w-4 h-4 text-stone-400 absolute top-3.5 start-3.5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={dict.menu.searchPlaceholder}
          className="w-full text-xs sm:text-sm ps-10 pe-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-850 text-stone-900 dark:text-white placeholder:text-stone-400 shadow-sm focus:outline-none focus:border-pizza-600 transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute top-3.5 end-3 text-xs text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
          >
            مسح
          </button>
        )}
      </div>

      {/* Category Tabs */}
      <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setActiveCategorySlug("all")}
          className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeCategorySlug === "all"
              ? "bg-pizza-700 text-white shadow-md shadow-pizza-700/20"
              : "bg-white dark:bg-stone-850 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-800 hover:bg-stone-50"
          }`}
        >
          {dict.menu.all} ({allProducts.length})
        </button>

        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategorySlug(cat.slug)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeCategorySlug === cat.slug
                ? "bg-pizza-700 text-white shadow-md shadow-pizza-700/20"
                : "bg-white dark:bg-stone-850 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-800 hover:bg-stone-50"
            }`}
          >
            {language === "ar" ? cat.nameAr : cat.nameEn} ({cat.products.length})
          </button>
        ))}
      </div>

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-20 space-y-3">
          <div className="w-14 h-14 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center mx-auto text-stone-400">
            <Pizza className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-stone-800 dark:text-stone-200">
            {dict.menu.emptyCategory}
          </h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <MenuCard
              key={product.id}
              product={product}
              onCustomize={(p) => setSelectedProduct(p)}
            />
          ))}
        </div>
      )}

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
