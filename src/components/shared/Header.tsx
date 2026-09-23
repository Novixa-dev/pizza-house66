"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useApp } from "@/context/AppContext";
import {
  ShoppingBag,
  Moon,
  Sun,
  Globe,
  Menu as MenuIcon,
  X,
  Pizza,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Container } from "@/components/ui/Card";

interface ServingStatus {
  isOpen: boolean | null;
  isPaused: boolean;
}

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
  const [status, setStatus] = useState<ServingStatus | null>(null);
  const pathname = usePathname();

  // Open/closed is time-sensitive, so it is fetched rather than baked into a
  // cached page. Until it arrives the badge renders nothing — claiming "open"
  // by default would be a lie at 3am.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/status")
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setStatus(d);
      })
      .catch(() => {
        /* badge stays hidden */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Customer-facing routes only. Staff surfaces (/admin, /kitchen) are reached
  // directly by staff and must not be advertised in the public nav.
  const navLinks = [
    { href: "/", label: dict.nav.home },
    { href: "/menu", label: dict.nav.menu },
    { href: "/track", label: dict.nav.trackOrder },
  ];

  const closeMobile = () => setIsMobileMenuOpen(false);

  return (
    <header className="sticky top-0 z-40 bg-surface border-b border-subtle">
      <Container>
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
          {/* Brand */}
          <a
            href="/"
            className="flex items-center gap-2.5 rounded-control shrink-0"
          >
            <span
              className="w-10 h-10 rounded-control bg-brand text-brand-content flex items-center justify-center shrink-0"
              aria-hidden="true"
            >
              <Pizza className="w-5 h-5" />
            </span>
            <span className="min-w-0">
              <span className="block text-lg sm:text-xl font-bold tracking-tight text-content truncate">
                {dict.brand.name}
              </span>
              <span className="hidden sm:block text-xs text-content-muted truncate">
                {dict.brand.masaken}
              </span>
            </span>
          </a>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <a
                  key={link.href}
                  href={link.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "px-3 py-2 rounded-control text-sm font-semibold transition-colors",
                    isActive
                      ? "text-brand bg-brand-subtle"
                      : "text-content-secondary hover:text-content hover:bg-surface-sunken"
                  )}
                >
                  {link.label}
                </a>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            {status && status.isOpen !== null && (
              <span
                className={cn(
                  "hidden lg:inline-flex items-center gap-1.5 rounded-control px-2.5 py-1 text-xs font-semibold",
                  status.isOpen
                    ? "bg-status-ready-bg text-status-ready-fg"
                    : "bg-status-done-bg text-status-done-fg"
                )}
              >
                <span
                  className={cn(
                    "w-1.5 h-1.5 rounded-full bg-current",
                    status.isOpen && "animate-status-pulse"
                  )}
                  aria-hidden="true"
                />
                {status.isOpen ? dict.brand.openNow : dict.brand.closedNow}
              </span>
            )}

            <button
              type="button"
              onClick={() => setLanguage(language === "ar" ? "en" : "ar")}
              className="inline-flex items-center gap-1.5 h-10 px-2.5 rounded-control text-sm font-semibold text-content-secondary hover:bg-surface-sunken hover:text-content transition-colors"
              aria-label={language === "ar" ? "Switch to English" : "التبديل إلى العربية"}
            >
              <Globe className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">
                {language === "ar" ? "EN" : "ع"}
              </span>
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex items-center justify-center w-10 h-10 rounded-control text-content-secondary hover:bg-surface-sunken hover:text-content transition-colors"
              aria-label={
                theme === "light"
                  ? language === "ar" ? "الوضع الداكن" : "Dark mode"
                  : language === "ar" ? "الوضع الفاتح" : "Light mode"
              }
            >
              {theme === "light" ? (
                <Moon className="w-5 h-5" aria-hidden="true" />
              ) : (
                <Sun className="w-5 h-5" aria-hidden="true" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="relative inline-flex items-center justify-center w-10 h-10 rounded-control text-content-secondary hover:bg-surface-sunken hover:text-content transition-colors"
              aria-label={`${dict.nav.cart}${cartCount > 0 ? ` (${cartCount})` : ""}`}
            >
              <ShoppingBag className="w-5 h-5" aria-hidden="true" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -end-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-brand text-brand-content text-2xs font-bold flex items-center justify-center tabular">
                  {cartCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((v) => !v)}
              className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-control text-content-secondary hover:bg-surface-sunken transition-colors"
              aria-expanded={isMobileMenuOpen}
              aria-label={language === "ar" ? "القائمة" : "Menu"}
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" aria-hidden="true" />
              ) : (
                <MenuIcon className="w-5 h-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </Container>

      {/* Mobile nav */}
      {isMobileMenuOpen && (
        <nav className="md:hidden border-t border-subtle bg-surface animate-slide-up">
          <Container className="py-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={closeMobile}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "block px-3 py-3 rounded-control text-sm font-semibold transition-colors",
                    isActive
                      ? "text-brand bg-brand-subtle"
                      : "text-content-secondary hover:bg-surface-sunken"
                  )}
                >
                  {link.label}
                </a>
              );
            })}
          </Container>
        </nav>
      )}
    </header>
  );
}
