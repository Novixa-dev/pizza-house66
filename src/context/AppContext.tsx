"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { CartItem, Language } from "@/types";
import { getDictionary } from "@/lib/i18n/dictionaries";

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: "light" | "dark";
  toggleTheme: () => void;
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, "cartItemId" | "subtotal">) => void;
  updateQuantity: (cartItemId: string, delta: number) => void;
  removeFromCart: (cartItemId: string) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  cartCount: number;
  cartTotal: number;
  dict: ReturnType<typeof getDictionary>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

/** Keeps `dir` and `lang` on <html> in step with the active language. */
function applyDirection(lang: Language) {
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  document.documentElement.lang = lang;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("ar");
  const [theme, setThemeState] = useState<"light" | "dark">("light");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    // Load language from storage
    const savedLang = localStorage.getItem("ph_lang") as Language;
    if (savedLang === "ar" || savedLang === "en") {
      setLanguageState(savedLang);
      // The pre-paint script in layout.tsx already set these, but restate them
      // so the DOM stays correct if that script was blocked or storage changed
      // in another tab.
      applyDirection(savedLang);
    }
    // Load theme from storage
    const savedTheme = localStorage.getItem("ph_theme") as "light" | "dark";
    if (savedTheme === "light" || savedTheme === "dark") {
      setThemeState(savedTheme);
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      // No stored choice: follow the OS, matching the pre-paint script.
      setThemeState("dark");
    }
    // Load cart
    try {
      const savedCart = localStorage.getItem("ph_cart");
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    } catch (e) {
      console.error("Failed to parse cart from storage:", e);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("ph_lang", lang);
    applyDirection(lang);
  };

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setThemeState(next);
    localStorage.setItem("ph_theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem("ph_cart", JSON.stringify(newCart));
  };

  const addToCart = (item: Omit<CartItem, "cartItemId" | "subtotal">) => {
    const cartItemId = `${item.productId}-${item.selectedOptions
      .map((o) => o.optionId)
      .sort()
      .join("-")}-${item.notes || ""}`;

    const existingIndex = cart.findIndex((c) => c.cartItemId === cartItemId);
    const itemSubtotal = item.unitPrice * item.quantity;

    if (existingIndex > -1) {
      const updated = [...cart];
      const newQty = updated[existingIndex].quantity + item.quantity;
      updated[existingIndex].quantity = newQty;
      updated[existingIndex].subtotal = updated[existingIndex].unitPrice * newQty;
      saveCart(updated);
    } else {
      const newItem: CartItem = {
        ...item,
        cartItemId,
        subtotal: itemSubtotal,
      };
      saveCart([...cart, newItem]);
    }
    setIsCartOpen(true);
  };

  const updateQuantity = (cartItemId: string, delta: number) => {
    const updated = cart
      .map((item) => {
        if (item.cartItemId === cartItemId) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          return {
            ...item,
            quantity: newQty,
            subtotal: item.unitPrice * newQty,
          };
        }
        return item;
      })
      .filter(Boolean) as CartItem[];

    saveCart(updated);
  };

  const removeFromCart = (cartItemId: string) => {
    saveCart(cart.filter((item) => item.cartItemId !== cartItemId));
  };

  const clearCart = () => {
    saveCart([]);
  };

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = cart.reduce((acc, item) => acc + item.subtotal, 0);
  const dict = getDictionary(language);

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        theme,
        toggleTheme,
        cart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        cartCount,
        cartTotal,
        dict,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
