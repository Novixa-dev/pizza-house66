"use client";

import React from "react";
import { useApp } from "@/context/AppContext";
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, ArrowLeft } from "lucide-react";

export default function CartDrawer() {
  const {
    isCartOpen,
    setIsCartOpen,
    cart,
    updateQuantity,
    removeFromCart,
    clearCart,
    cartTotal,
    cartCount,
    language,
    dict,
  } = useApp();

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-stone-950/60 backdrop-blur-sm transition-opacity"
      />

      {/* Slide-over panel */}
      <div
        className={`fixed inset-y-0 ${
          language === "ar" ? "left-0" : "right-0"
        } max-w-full flex w-full sm:max-w-md`}
      >
        <div className="w-full bg-white dark:bg-stone-900 shadow-2xl flex flex-col justify-between border-stone-200 dark:border-stone-800 transition-colors">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-pizza-100 dark:bg-pizza-950 flex items-center justify-center text-pizza-700 dark:text-pizza-300">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900 dark:text-white font-cairo">
                  {dict.cart.title}
                </h3>
                <span className="text-xs text-stone-500">
                  {cartCount} {language === "ar" ? "أصناف" : "items"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/40"
                  title={dict.cart.clear}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {cart.length === 0 ? (
              <div className="text-center py-16 px-4 space-y-3">
                <div className="w-16 h-16 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center mx-auto text-stone-400">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h4 className="text-base font-bold text-stone-800 dark:text-stone-200">
                  {dict.cart.emptyTitle}
                </h4>
                <p className="text-xs text-stone-500 max-w-xs mx-auto">
                  {dict.cart.emptyDesc}
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-pizza-700 dark:text-pizza-400 bg-pizza-50 dark:bg-pizza-950/60 px-4 py-2 rounded-xl"
                  >
                    <span>{dict.cart.continueShopping}</span>
                    {language === "ar" ? (
                      <ArrowLeft className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowRight className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.cartItemId}
                  className="p-3 bg-stone-50 dark:bg-stone-850 rounded-2xl border border-stone-200/60 dark:border-stone-800/80 flex gap-3 transition-colors"
                >
                  <img
                    src={item.imageUrl}
                    alt={language === "ar" ? item.nameAr : item.nameEn}
                    className="w-18 h-18 sm:w-20 sm:h-20 rounded-xl object-cover flex-shrink-0 bg-stone-200 dark:bg-stone-800"
                  />
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className="text-sm font-bold text-stone-900 dark:text-white truncate">
                          {language === "ar" ? item.nameAr : item.nameEn}
                        </h4>
                        <button
                          onClick={() => removeFromCart(item.cartItemId)}
                          className="text-stone-400 hover:text-red-500 p-0.5"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Selected Options Summary */}
                      {item.selectedOptions && item.selectedOptions.length > 0 && (
                        <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 line-clamp-2">
                          {item.selectedOptions
                            .map((o) => (language === "ar" ? o.optionNameAr : o.optionNameEn))
                            .join(" • ")}
                        </div>
                      )}

                      {item.notes && (
                        <p className="text-[10px] text-pizza-700 dark:text-pizza-400 mt-0.5 italic truncate">
                          &quot;{item.notes}&quot;
                        </p>
                      )}
                    </div>

                    <div className="flex justify-between items-center mt-2 pt-1 border-t border-stone-200/40 dark:border-stone-800/40">
                      {/* Quantity Selector */}
                      <div className="flex items-center gap-1.5 bg-white dark:bg-stone-800 px-1.5 py-0.5 rounded-lg border border-stone-200 dark:border-stone-700">
                        <button
                          onClick={() => updateQuantity(item.cartItemId, -1)}
                          className="p-1 text-stone-500 hover:text-stone-900 dark:hover:text-white"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold font-outfit px-1">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.cartItemId, 1)}
                          className="p-1 text-stone-500 hover:text-stone-900 dark:hover:text-white"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Item Total */}
                      <div className="text-sm font-black text-stone-900 dark:text-stone-100 font-outfit">
                        {item.subtotal.toLocaleString()}{" "}
                        <span className="text-xs font-normal font-cairo text-stone-500">
                          {dict.menu.currency}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Checkout Action */}
          {cart.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-stone-200 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-900/90 space-y-3">
              <div className="flex justify-between items-center text-sm text-stone-600 dark:text-stone-400">
                <span>{dict.cart.subtotal}</span>
                <span className="font-bold font-outfit text-stone-900 dark:text-white">
                  {cartTotal.toLocaleString()} {dict.menu.currency}
                </span>
              </div>

              <div className="flex justify-between items-center text-base font-black text-stone-900 dark:text-white pt-1 border-t border-stone-200 dark:border-stone-800">
                <span>{dict.cart.total}</span>
                <span className="text-xl text-pizza-700 dark:text-pizza-400 font-outfit">
                  {cartTotal.toLocaleString()} {dict.menu.currency}
                </span>
              </div>

              <a
                href="/checkout"
                onClick={() => setIsCartOpen(false)}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-pizza-700 via-pizza-600 to-pizza-700 hover:from-pizza-800 hover:to-pizza-800 text-white py-3 px-4 rounded-xl text-base font-bold shadow-lg shadow-pizza-700/25 active:scale-[0.99] transition-all"
              >
                <span>{dict.cart.checkout}</span>
                {language === "ar" ? (
                  <ArrowLeft className="w-4 h-4" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
