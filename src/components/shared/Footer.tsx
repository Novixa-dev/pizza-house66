"use client";

import React from "react";
import { useApp } from "@/context/AppContext";
import { Pizza, MapPin, Instagram, MessageCircle } from "lucide-react";
import { Container } from "@/components/ui/Card";

/**
 * Opening hours deliberately do NOT appear here.
 *
 * They live in the database and are rendered on the homepage from that source.
 * Repeating them in the footer would mean a manager changing hours in the
 * dashboard leaves a stale second copy on every page. The footer links to the
 * authoritative view instead.
 */
export default function Footer() {
  const { dict } = useApp();

  const links = [
    { href: "/menu", label: dict.nav.menu },
    { href: "/track", label: dict.nav.trackOrder },
    { href: "/#featured", label: dict.featured.viewAll },
    { href: "/", label: dict.footer.viewHours },
  ];

  return (
    <footer className="mt-auto bg-surface-sunken border-t border-subtle">
      <Container className="py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pb-8 border-b border-subtle">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <span
                className="w-9 h-9 rounded-control bg-brand text-brand-content flex items-center justify-center"
                aria-hidden="true"
              >
                <Pizza className="w-5 h-5" />
              </span>
              <span className="text-lg font-bold text-content">
                {dict.brand.name}
              </span>
            </div>
            <p className="text-sm text-content-secondary max-w-xs">
              {dict.footer.tagline}
            </p>
            <div className="flex items-center gap-2">
              <a
                href="https://www.instagram.com/pizza_house66/"
                target="_blank"
                rel="noreferrer"
                aria-label={dict.footer.instagramLabel}
                className="w-10 h-10 rounded-control border border-default bg-surface text-content-secondary hover:text-content hover:bg-surface-sunken flex items-center justify-center transition-colors"
              >
                <Instagram className="w-4 h-4" aria-hidden="true" />
              </a>
              <a
                href="https://wa.me/967772207788"
                target="_blank"
                rel="noreferrer"
                aria-label={dict.location.whatsappLabel}
                className="w-10 h-10 rounded-control border border-default bg-surface text-content-secondary hover:text-content hover:bg-surface-sunken flex items-center justify-center transition-colors"
              >
                <MessageCircle className="w-4 h-4" aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-3">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold text-content">
              <MapPin className="w-4 h-4 text-content-muted" aria-hidden="true" />
              {dict.footer.contactTitle}
            </h2>
            <address className="not-italic space-y-2 text-sm text-content-secondary">
              <p>
                {dict.brand.masaken}
                <br />
                {dict.brand.landmarks}
              </p>
              <p>
                <span className="text-content-muted">{dict.footer.landline}: </span>
                <a
                  href="tel:05375561"
                  className="tabular text-content hover:text-brand rounded-control"
                  dir="ltr"
                >
                  05375561
                </a>
              </p>
              <p>
                <span className="text-content-muted">{dict.footer.mobile}: </span>
                <a
                  href="https://wa.me/967772207788"
                  target="_blank"
                  rel="noreferrer"
                  className="tabular text-content hover:text-brand rounded-control"
                  dir="ltr"
                >
                  +967 772207788
                </a>
              </p>
            </address>
          </div>

          {/* Links — customer-facing only; staff surfaces are not advertised. */}
          <nav className="space-y-3">
            <h2 className="text-sm font-semibold text-content">
              {dict.footer.linksTitle}
            </h2>
            <ul className="space-y-2 text-sm">
              {links.map((link) => (
                <li key={link.href + link.label}>
                  <a
                    href={link.href}
                    className="text-content-secondary hover:text-brand transition-colors rounded-control"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-content-muted">
          <p>
            © {new Date().getFullYear()} {dict.brand.name} — {dict.footer.rights}
          </p>
          <p className="flex items-center gap-1.5">
            <span>{dict.footer.poweredBy}</span>
            <span className="font-semibold text-content-secondary">
              Novixa Restaurant
            </span>
          </p>
        </div>
      </Container>
    </footer>
  );
}
