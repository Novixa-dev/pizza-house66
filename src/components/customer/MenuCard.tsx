"use client";

import React from "react";
import { useApp } from "@/context/AppContext";
import { Plus, Star } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { CustomizerProduct } from "./CustomizerModal";

interface MenuCardProps {
  product: CustomizerProduct;
  onCustomize: (product: CustomizerProduct) => void;
}

export default function MenuCard({ product, onCustomize }: MenuCardProps) {
  const { language, dict } = useApp();
  const name = language === "ar" ? product.nameAr : product.nameEn;
  const description =
    language === "ar" ? product.descriptionAr : product.descriptionEn;

  return (
    <article
      className={cn(
        "group flex flex-col bg-surface border border-subtle rounded-card overflow-hidden",
        "transition-colors duration-200",
        product.isAvailable ? "hover:border-strong" : "opacity-75"
      )}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-sunken">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.imageUrl}
          alt={name}
          loading="lazy"
          className={cn(
            "w-full h-full object-cover transition-transform duration-500",
            product.isAvailable && "group-hover:scale-[1.03] motion-reduce:group-hover:scale-100",
            !product.isAvailable && "grayscale"
          )}
        />

        {!product.isAvailable && (
          <div className="absolute inset-0 bg-surface-overlay/55 flex items-center justify-center">
            <span className="bg-surface text-status-danger-fg text-xs font-bold px-3 py-1.5 rounded-control">
              {dict.menu.soldOut}
            </span>
          </div>
        )}

        {/* Driven by the staff-managed flag, never inferred from price. */}
        {product.isAvailable && product.isFeatured && (
          <span className="absolute top-3 start-3 inline-flex items-center gap-1 bg-accent text-accent-content text-2xs font-bold px-2 py-1 rounded-control">
            <Star className="w-3 h-3 fill-current" aria-hidden="true" />
            {dict.menu.featured}
          </span>
        )}
      </div>

      <div className="flex flex-col flex-1 p-4 gap-3">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-content leading-snug">{name}</h3>
          <p className="text-sm text-content-secondary line-clamp-2">
            {description}
          </p>
        </div>

        <div className="mt-auto pt-3 flex items-center justify-between gap-3 border-t border-subtle">
          <div>
            <span className="block text-2xs text-content-muted">
              {dict.menu.fromPrice}
            </span>
            <span className="text-lg font-bold text-content tabular">
              {product.basePrice.toLocaleString("en-US")}
              <span className="ms-1 text-xs font-semibold text-content-secondary">
                {dict.menu.currency}
              </span>
            </span>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => onCustomize(product)}
            disabled={!product.isAvailable}
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{dict.menu.customize}</span>
          </Button>
        </div>
      </div>
    </article>
  );
}
