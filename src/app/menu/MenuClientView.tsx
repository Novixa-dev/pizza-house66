"use client";

import React, { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { Search, Pizza, X } from "lucide-react";
import MenuCard from "@/components/customer/MenuCard";
import CustomizerModal, {
  CustomizerProduct,
} from "@/components/customer/CustomizerModal";
import { cn } from "@/lib/cn";
import { Container, EmptyState } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface CategoryWithProducts {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  products: CustomizerProduct[];
}

interface MenuClientViewProps {
  categories: CategoryWithProducts[];
}

const ALL = "all";

export default function MenuClientView({ categories }: MenuClientViewProps) {
  const { language, dict } = useApp();

  const [activeSlug, setActiveSlug] = useState<string>(ALL);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] =
    useState<CustomizerProduct | null>(null);

  const allProducts = useMemo(
    () =>
      categories.flatMap((cat) =>
        cat.products.map((p) => ({ ...p, categorySlug: cat.slug }))
      ),
    [categories]
  );

  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return allProducts.filter((product) => {
      const matchesCategory =
        activeSlug === ALL || product.categorySlug === activeSlug;
      if (!matchesCategory) return false;
      if (!q) return true;
      return [
        product.nameAr,
        product.nameEn,
        product.descriptionAr,
        product.descriptionEn,
      ].some((field) => field.toLowerCase().includes(q));
    });
  }, [allProducts, activeSlug, searchQuery]);

  const tabs = [
    { slug: ALL, label: dict.menu.all, count: allProducts.length },
    ...categories.map((cat) => ({
      slug: cat.slug,
      label: language === "ar" ? cat.nameAr : cat.nameEn,
      count: cat.products.length,
    })),
  ];

  const isSearching = searchQuery.trim().length > 0;

  return (
    <Container className="py-10 sm:py-14 space-y-8">
      <header className="text-center space-y-2 max-w-2xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-content">
          {dict.menu.title}
        </h1>
        <p className="text-base text-content-secondary">{dict.menu.subtitle}</p>
      </header>

      {/* Search */}
      <div className="max-w-md mx-auto relative">
        <Search
          className="w-4 h-4 text-content-muted absolute top-1/2 -translate-y-1/2 start-3.5 pointer-events-none"
          aria-hidden="true"
        />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={dict.menu.searchPlaceholder}
          aria-label={dict.menu.searchPlaceholder}
          className={cn(
            "w-full text-sm ps-10 pe-10 py-3 min-h-[44px]",
            "rounded-control border border-default bg-surface text-content",
            "placeholder:text-content-muted transition-colors",
            "focus:border-brand [&::-webkit-search-cancel-button]:hidden"
          )}
        />
        {isSearching && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            aria-label={dict.menu.clearSearch}
            className="absolute top-1/2 -translate-y-1/2 end-2 w-8 h-8 rounded-control flex items-center justify-center text-content-muted hover:text-content hover:bg-surface-sunken transition-colors"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Category tabs. Horizontally scrollable on phones rather than wrapping
          into a tall block that pushes the products below the fold. */}
      <div
        role="tablist"
        aria-label={dict.menu.title}
        className="flex items-center justify-start lg:justify-center gap-2 overflow-x-auto pb-1 -mx-4 px-4"
      >
        {tabs.map((tab) => {
          const isActive = activeSlug === tab.slug;
          return (
            <button
              key={tab.slug}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveSlug(tab.slug)}
              className={cn(
                "shrink-0 px-4 py-2 min-h-[40px] rounded-control text-sm font-semibold transition-colors",
                isActive
                  ? "bg-brand text-brand-content"
                  : "bg-surface text-content-secondary border border-default hover:bg-surface-sunken hover:text-content"
              )}
            >
              {tab.label}
              <span className="ms-1.5 tabular opacity-70">{tab.count}</span>
            </button>
          );
        })}
      </div>

      {/* Results */}
      {filteredProducts.length === 0 ? (
        <EmptyState
          icon={Pizza}
          title={isSearching ? dict.menu.noResults : dict.menu.emptyCategory}
          description={
            isSearching ? `${dict.menu.resultsFor} "${searchQuery.trim()}"` : undefined
          }
          action={
            isSearching ? (
              <Button variant="secondary" onClick={() => setSearchQuery("")}>
                {dict.menu.clearSearch}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProducts.map((product) => (
            <MenuCard
              key={product.id}
              product={product}
              onCustomize={setSelectedProduct}
            />
          ))}
        </div>
      )}

      {selectedProduct && (
        <CustomizerModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </Container>
  );
}
