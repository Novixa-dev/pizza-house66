"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/context/AppContext";
import {
  ShoppingBag,
  Moon,
  Sun,
  Globe,
  Menu as MenuIcon,
  X,
  Clock,
  MapPin,
  Pizza,
  ChefHat,
  ShieldCheck,
} from "lucide-react";

export default function Header() {
  const {
    language,
    setLanguage,
    theme,
    toggleTheme,
    cartCount,
    setIsCartOpen,
    dict,
  } = useApp();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { href: "/", label: dict.nav.home },
    { href: "/menu", label: dict.nav.menu },
    { href: "/track", label: dict.nav.trackOrder },
    { href: "/kitchen", label: dict.nav.kitchen, badge: "KDS" },
    { href: "/admin", label: dict.nav.admin },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-b border-stone-200/80 dark:border-stone-800 transition-colors">
      {/* Top micro bar for branch details & hours */}
      <div className="bg-stone-900 text-stone-300 text-xs py-1.5 px-4 hidden md:block">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-pizza-400" />
              <span>{dict.brand.masaken} ({dict.brand.landmarks})</span>
            </span>
            <span className="text-stone-600">|</span>
            <span className="flex items-center gap-1.5 text-pizza-300 font-medium">
              <Clock className="w-3.5 h-3.5 text-crust-400" />
              <span>4:00 م - 11:30 م (فترة المساء)</span>
            </span>
          </div>
          <div className="flex items-center gap-3 text-stone-400">
            <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full text-[11px] font-medium border border-emerald-800/40">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              {dict.brand.openNow}
            </span>
            <span>{dict.brand.phones}</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand Logo & Name */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-pizza-600 via-pizza-700 to-pizza-900 flex items-center justify-center text-white shadow-lg shadow-pizza-700/20 group-hover:scale-105 transition-transform">
              <Pizza className="w-6 h-6 sm:w-7 sm:h-7 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-stone-900 dark:text-white font-cairo">
                  {dict.brand.name}
                </span>
                <span className="text-xs bg-pizza-100 dark:bg-pizza-950 text-pizza-700 dark:text-pizza-300 px-1.5 py-0.5 rounded font-bold font-outfit">
                  66
                </span>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 hidden sm:block">
                {dict.brand.tagline}
              </p>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                    isActive
                      ? "text-pizza-700 dark:text-pizza-400 bg-pizza-50 dark:bg-pizza-950/50"
                      : "text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800"
                  }`}
                >
                  {link.label}
                  {link.badge && (
                    <span className="text-[10px] font-bold bg-crust-500 text-stone-950 px-1.5 py-0.2 rounded font-outfit">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Actions & Utilities */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Switcher */}
            <button
              onClick={() => setLanguage(language === "ar" ? "en" : "ar")}
              className="p-2 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-bold font-outfit flex items-center gap-1"
              title="تغيير اللغة / Switch Language"
              aria-label="Switch Language"
            >
              <Globe className="w-4 h-4" />
              <span>{language === "ar" ? "EN" : "عربي"}</span>
            </button>

            {/* Dark / Light Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
              title="تبديل المظهر"
              aria-label="Toggle Theme"
            >
              {theme === "light" ? (
                <Moon className="w-4 h-4" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400" />
              )}
            </button>

            {/* Cart Trigger */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-2 bg-pizza-700 hover:bg-pizza-800 text-white px-3.5 py-2 rounded-xl text-sm font-bold shadow-md shadow-pizza-700/20 active:scale-95 transition-transform"
              aria-label="Open Shopping Cart"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">{dict.nav.cart}</span>
              {cartCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-amber-400 text-stone-950 text-xs font-black flex items-center justify-center font-outfit animate-pulse-subtle">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 md:hidden text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg"
              aria-label="Open Mobile Menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <MenuIcon className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 px-4 pt-3 pb-5 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-base font-bold text-stone-800 dark:text-stone-200 hover:bg-pizza-50 dark:hover:bg-stone-800"
            >
              <div className="flex items-center justify-between">
                <span>{link.label}</span>
                {link.badge && (
                  <span className="text-xs bg-crust-500 text-stone-950 font-bold px-2 py-0.5 rounded font-outfit">
                    {link.badge}
                  </span>
                )}
              </div>
            </Link>
          ))}
          <div className="pt-3 border-t border-stone-200 dark:border-stone-800 text-xs text-stone-500 space-y-1">
            <p className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-pizza-600" />
              <span>{dict.brand.masaken}</span>
            </p>
            <p className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-crust-500" />
              <span>8:00 ص - 12:00 م | 4:00 م - 11:30 م</span>
            </p>
          </div>
        </div>
      )}
    </header>
  );
}
