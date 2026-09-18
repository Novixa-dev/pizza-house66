"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { X, Plus, Minus, Check, Sparkles } from "lucide-react";
import { SelectedOptionPayload } from "@/types";

export interface CustomizerProduct {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  basePrice: number;
  imageUrl: string;
  isAvailable: boolean;
  optionGroups: {
    id: string;
    nameAr: string;
    nameEn: string;
    type: string; // "RADIO" or "CHECKBOX"
    isRequired: boolean;
    minSelect: number;
    maxSelect: number;
    options: {
      id: string;
      nameAr: string;
      nameEn: string;
      priceDelta: number;
      isAvailable: boolean;
    }[];
  }[];
}

interface CustomizerModalProps {
  product: CustomizerProduct | null;
  onClose: () => void;
}

export default function CustomizerModal({
  product,
  onClose,
}: CustomizerModalProps) {
  const { language, addToCart, dict } = useApp();

  const [selectedRadio, setSelectedRadio] = useState<Record<string, string>>({});
  const [selectedCheckbox, setSelectedCheckbox] = useState<Record<string, string[]>>({});
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");

  // Initialize default selections when product changes
  useEffect(() => {
    if (!product) return;

    const initialRadio: Record<string, string> = {};
    const initialCheckbox: Record<string, string[]> = {};

    product.optionGroups.forEach((group) => {
      if (group.type === "RADIO" && group.options.length > 0) {
        // Select first available option as default
        const firstAvail = group.options.find((o) => o.isAvailable) || group.options[0];
        initialRadio[group.id] = firstAvail.id;
      } else if (group.type === "CHECKBOX") {
        initialCheckbox[group.id] = [];
      }
    });

    setSelectedRadio(initialRadio);
    setSelectedCheckbox(initialCheckbox);
    setQuantity(1);
    setNotes("");
  }, [product]);

  if (!product) return null;

  // Calculate live unit price
  let unitPrice = product.basePrice;
  const currentSelections: SelectedOptionPayload[] = [];

  product.optionGroups.forEach((group) => {
    if (group.type === "RADIO") {
      const selectedId = selectedRadio[group.id];
      const opt = group.options.find((o) => o.id === selectedId);
      if (opt) {
        unitPrice += opt.priceDelta;
        currentSelections.push({
          groupId: group.id,
          groupNameAr: group.nameAr,
          groupNameEn: group.nameEn,
          optionId: opt.id,
          optionNameAr: opt.nameAr,
          optionNameEn: opt.nameEn,
          priceDelta: opt.priceDelta,
        });
      }
    } else if (group.type === "CHECKBOX") {
      const selectedIds = selectedCheckbox[group.id] || [];
      selectedIds.forEach((id) => {
        const opt = group.options.find((o) => o.id === id);
        if (opt) {
          unitPrice += opt.priceDelta;
          currentSelections.push({
            groupId: group.id,
            groupNameAr: group.nameAr,
            groupNameEn: group.nameEn,
            optionId: opt.id,
            optionNameAr: opt.nameAr,
            optionNameEn: opt.nameEn,
            priceDelta: opt.priceDelta,
          });
        }
      });
    }
  });

  const totalPrice = unitPrice * quantity;

  const handleRadioChange = (groupId: string, optionId: string) => {
    setSelectedRadio((prev) => ({ ...prev, [groupId]: optionId }));
  };

  const handleCheckboxToggle = (
    groupId: string,
    optionId: string,
    maxSelect: number
  ) => {
    const current = selectedCheckbox[groupId] || [];
    if (current.includes(optionId)) {
      setSelectedCheckbox((prev) => ({
        ...prev,
        [groupId]: current.filter((id) => id !== optionId),
      }));
    } else {
      if (maxSelect && current.length >= maxSelect) {
        return; // Max reached
      }
      setSelectedCheckbox((prev) => ({
        ...prev,
        [groupId]: [...current, optionId],
      }));
    }
  };

  const handleAddToCart = () => {
    addToCart({
      productId: product.id,
      nameAr: product.nameAr,
      nameEn: product.nameEn,
      imageUrl: product.imageUrl,
      basePrice: product.basePrice,
      unitPrice,
      quantity,
      selectedOptions: currentSelections,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-stone-950/70 backdrop-blur-sm transition-opacity"
      />

      {/* Dialog Modal */}
      <div className="relative w-full max-w-xl bg-white dark:bg-stone-900 rounded-3xl shadow-2xl overflow-hidden z-10 border border-stone-200 dark:border-stone-800 flex flex-col max-h-[90vh]">
        {/* Header with image */}
        <div className="relative h-44 sm:h-52 w-full flex-shrink-0 bg-stone-200 dark:bg-stone-800">
          <img
            src={product.imageUrl}
            alt={language === "ar" ? product.nameAr : product.nameEn}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/30 to-transparent" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 end-3 w-8 h-8 rounded-full bg-stone-900/60 hover:bg-stone-900 text-white flex items-center justify-center backdrop-blur-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Product Title on Image */}
          <div className="absolute bottom-3 start-4 end-4">
            <h3 className="text-xl sm:text-2xl font-black text-white drop-shadow-md">
              {language === "ar" ? product.nameAr : product.nameEn}
            </h3>
            <p className="text-xs text-stone-200 line-clamp-1 mt-0.5 drop-shadow">
              {language === "ar" ? product.descriptionAr : product.descriptionEn}
            </p>
          </div>
        </div>

        {/* Option Groups Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {product.optionGroups.map((group) => {
            const isRadio = group.type === "RADIO";
            return (
              <div key={group.id} className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-2">
                    <span>{language === "ar" ? group.nameAr : group.nameEn}</span>
                    {group.isRequired && (
                      <span className="text-[10px] text-pizza-600 dark:text-pizza-400 bg-pizza-50 dark:bg-pizza-950/60 px-2 py-0.5 rounded-full font-medium">
                        {language === "ar" ? "إجباري" : "Required"}
                      </span>
                    )}
                  </h4>
                  {group.type === "CHECKBOX" && group.maxSelect > 1 && (
                    <span className="text-[11px] text-stone-400">
                      {language === "ar"
                        ? `اختر حتى ${group.maxSelect}`
                        : `Up to ${group.maxSelect}`}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {group.options.map((opt) => {
                    const isSelected = isRadio
                      ? selectedRadio[group.id] === opt.id
                      : (selectedCheckbox[group.id] || []).includes(opt.id);

                    return (
                      <button
                        type="button"
                        key={opt.id}
                        disabled={!opt.isAvailable}
                        onClick={() =>
                          isRadio
                            ? handleRadioChange(group.id, opt.id)
                            : handleCheckboxToggle(
                                group.id,
                                opt.id,
                                group.maxSelect
                              )
                        }
                        className={`p-3 rounded-2xl border text-start flex items-center justify-between transition-all ${
                          !opt.isAvailable
                            ? "opacity-40 cursor-not-allowed border-stone-200 dark:border-stone-800"
                            : isSelected
                            ? "border-pizza-600 bg-pizza-50/70 dark:bg-pizza-950/40 text-pizza-900 dark:text-pizza-200 shadow-sm"
                            : "border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 bg-white dark:bg-stone-850 text-stone-700 dark:text-stone-300"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-4 h-4 rounded-${
                              isRadio ? "full" : "md"
                            } border flex items-center justify-center ${
                              isSelected
                                ? "border-pizza-600 bg-pizza-600 text-white"
                                : "border-stone-300 dark:border-stone-600"
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span className="text-xs font-bold">
                            {language === "ar" ? opt.nameAr : opt.nameEn}
                          </span>
                        </div>

                        {opt.priceDelta !== 0 && (
                          <span className="text-xs font-outfit font-black text-pizza-700 dark:text-pizza-400">
                            +{opt.priceDelta.toLocaleString()} {dict.menu.currency}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Kitchen Instructions */}
          <div className="space-y-2 pt-2 border-t border-stone-200 dark:border-stone-800">
            <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
              {dict.customizer.notes}
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={dict.customizer.notesPlaceholder}
              className="w-full text-xs p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:border-pizza-600 transition-colors"
            />
          </div>
        </div>

        {/* Modal Footer with Live Quantity & Add Action */}
        <div className="p-4 sm:p-5 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/90 flex items-center justify-between gap-4">
          {/* Quantity selector */}
          <div className="flex items-center gap-2 bg-white dark:bg-stone-800 p-1 rounded-xl border border-stone-200 dark:border-stone-700">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-7 text-center font-outfit font-black text-stone-900 dark:text-white">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Add CTA */}
          <button
            onClick={handleAddToCart}
            className="flex-1 flex items-center justify-between bg-gradient-to-r from-pizza-700 to-pizza-600 hover:from-pizza-800 hover:to-pizza-700 text-white py-3 px-5 rounded-2xl font-bold text-sm shadow-lg shadow-pizza-700/20 active:scale-[0.99] transition-all"
          >
            <span>{dict.customizer.confirmAdd}</span>
            <span className="font-outfit text-base font-black">
              {totalPrice.toLocaleString()} {dict.menu.currency}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
