"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import {
  Clock,
  MapPin,
  Phone,
  MessageCircle,
  CheckCircle2,
  CalendarCheck,
  CreditCard,
  ArrowLeft,
  ArrowRight,
  Pizza,
  UtensilsCrossed,
} from "lucide-react";
import MenuCard from "@/components/customer/MenuCard";
import CustomizerModal, {
  CustomizerProduct,
} from "@/components/customer/CustomizerModal";
import { Button } from "@/components/ui/Button";
import { Card, Container, EmptyState } from "@/components/ui/Card";

/** Shape the homepage actually needs -- not `any`. */
interface BusinessHour {
  dayOfWeek: number;
  shiftName: string;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

interface RestaurantSummary {
  phone: string;
  whatsapp: string;
  businessHours: BusinessHour[];
}

interface HomeClientViewProps {
  restaurant: RestaurantSummary | null;
  featuredProducts: CustomizerProduct[];
}

export default function HomeClientView({
  restaurant,
  featuredProducts,
}: HomeClientViewProps) {
  const { language, dict } = useApp();
  const [selectedProduct, setSelectedProduct] =
    useState<CustomizerProduct | null>(null);

  const DirectionalArrow = language === "ar" ? ArrowLeft : ArrowRight;

  const trustPoints = [dict.hero.trust1, dict.hero.trust2, dict.hero.trust3];

  const pillars = [
    { icon: CalendarCheck, title: dict.hero.feature1Title, body: dict.hero.feature1Desc },
    { icon: Pizza, title: dict.hero.feature2Title, body: dict.hero.feature2Desc },
    { icon: CreditCard, title: dict.hero.feature3Title, body: dict.hero.feature3Desc },
  ];

  // Opening hours come from the database, so a manager changing them in the
  // dashboard is reflected here rather than drifting from a hardcoded table.
  const hoursByDay = groupHoursByDay(restaurant?.businessHours ?? []);

  return (
    <div className="pb-20">
      {/* ================================================================ */}
      {/* Hero                                                             */}
      {/* ================================================================ */}
      <section className="border-b border-subtle bg-surface">
        <Container className="py-12 sm:py-16 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            <div className="lg:col-span-7 space-y-6 text-center lg:text-start">
              <span className="inline-flex items-center gap-2 rounded-control bg-brand-subtle px-3 py-1.5 text-xs font-semibold text-brand">
                <MapPin className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                {dict.brand.masaken}
              </span>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-content text-balance">
                {dict.hero.title}
              </h1>

              <p className="text-lg text-content-secondary max-w-xl mx-auto lg:mx-0">
                {dict.hero.subtitle}
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => (window.location.href = "/menu")}
                >
                  <span>{dict.hero.primaryCta}</span>
                  <DirectionalArrow className="w-5 h-5" aria-hidden="true" />
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => (window.location.href = "#featured")}
                >
                  <UtensilsCrossed className="w-4 h-4" aria-hidden="true" />
                  <span>{dict.hero.secondaryCta}</span>
                </Button>
              </div>

              <ul className="pt-5 border-t border-subtle flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2">
                {trustPoints.map((point) => (
                  <li
                    key={point}
                    className="flex items-center gap-1.5 text-sm text-content-secondary"
                  >
                    <CheckCircle2
                      className="w-4 h-4 text-status-ready-fg shrink-0"
                      aria-hidden="true"
                    />
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            {/* The scheduling promise, shown rather than described. */}
            <div className="lg:col-span-5">
              <Card className="overflow-hidden">
                <div className="aspect-[4/3] bg-surface-sunken">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1000&q=85"
                    alt={dict.hero.heroImageAlt}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex items-center gap-3 p-4 border-t border-subtle">
                  <span
                    className="w-10 h-10 shrink-0 rounded-control bg-brand-subtle text-brand flex items-center justify-center"
                    aria-hidden="true"
                  >
                    <Clock className="w-5 h-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-content">
                      {dict.hero.scheduleCalloutTitle}
                    </p>
                    <p className="text-xs text-content-secondary">
                      {dict.hero.scheduleCalloutDesc}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </Container>
      </section>

      {/* ================================================================ */}
      {/* Value pillars                                                    */}
      {/* ================================================================ */}
      <Container className="py-14 sm:py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {pillars.map(({ icon: Icon, title, body }) => (
            <Card key={title} className="p-6 space-y-3">
              <span
                className="w-11 h-11 rounded-control bg-brand-subtle text-brand flex items-center justify-center"
                aria-hidden="true"
              >
                <Icon className="w-5 h-5" />
              </span>
              <h3 className="text-lg font-bold text-content">{title}</h3>
              <p className="text-sm text-content-secondary">{body}</p>
            </Card>
          ))}
        </div>
      </Container>

      {/* ================================================================ */}
      {/* Featured products                                                */}
      {/* ================================================================ */}
      <Container id="featured" className="pb-14 sm:pb-20 scroll-mt-20">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand">
              {dict.featured.eyebrow}
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-content">
              {dict.featured.title}
            </h2>
          </div>
          <a
            href="/menu"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:text-brand-hover rounded-control"
          >
            <span>{dict.featured.viewAll}</span>
            <DirectionalArrow className="w-4 h-4" aria-hidden="true" />
          </a>
        </div>

        {featuredProducts.length === 0 ? (
          <EmptyState icon={Pizza} title={dict.featured.empty} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {featuredProducts.map((product) => (
              <MenuCard
                key={product.id}
                product={product}
                onCustomize={setSelectedProduct}
              />
            ))}
          </div>
        )}
      </Container>

      {/* ================================================================ */}
      {/* Branch & hours                                                   */}
      {/* ================================================================ */}
      <Container>
        <Card className="p-6 sm:p-10 bg-surface-sunken">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            <div className="space-y-4">
              <span className="inline-block rounded-control bg-brand text-brand-content text-xs font-semibold px-2.5 py-1">
                {dict.location.tag}
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-content">
                {dict.location.title}
              </h2>
              <p className="text-sm text-content-secondary">
                {dict.location.description}
              </p>

              {restaurant && (
                <div className="flex flex-wrap gap-3 pt-1">
                  <a
                    href={`tel:${restaurant.phone}`}
                    className="inline-flex items-center gap-2 rounded-control border border-default bg-surface px-4 py-2.5 text-sm font-semibold text-content hover:bg-surface-sunken transition-colors"
                  >
                    <Phone className="w-4 h-4 text-brand" aria-hidden="true" />
                    <span className="tabular" dir="ltr">
                      {restaurant.phone}
                    </span>
                  </a>
                  <a
                    href={`https://wa.me/${restaurant.whatsapp.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-control border border-default bg-surface px-4 py-2.5 text-sm font-semibold text-content hover:bg-surface-sunken transition-colors"
                  >
                    <MessageCircle
                      className="w-4 h-4 text-status-ready-fg"
                      aria-hidden="true"
                    />
                    <span>{dict.location.whatsappLabel}</span>
                  </a>
                </div>
              )}
            </div>

            <div className="bg-surface border border-subtle rounded-card p-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-content mb-4">
                <Clock className="w-4 h-4 text-content-muted" aria-hidden="true" />
                {dict.location.hoursTitle}
              </h3>
              <dl className="divide-y divide-subtle">
                {hoursByDay.map(({ dayOfWeek, shifts }) => (
                  <div
                    key={dayOfWeek}
                    className="flex items-baseline justify-between gap-4 py-2 text-sm"
                  >
                    <dt className="text-content-secondary shrink-0">
                      {dict.location.days[dayOfWeek]}
                    </dt>
                    <dd
                      className="text-content font-medium text-end tabular"
                      dir="ltr"
                    >
                      {shifts.length === 0 ? (
                        <span className="text-content-muted">
                          {dict.location.closed}
                        </span>
                      ) : (
                        shifts
                          .map((s) => `${s.openTime} - ${s.closeTime}`)
                          .join(" / ")
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </Card>
      </Container>

      {selectedProduct && (
        <CustomizerModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
}

/** Collapses the flat BusinessHour rows into one entry per weekday, Sun-Sat. */
function groupHoursByDay(hours: BusinessHour[]) {
  return Array.from({ length: 7 }, (_, dayOfWeek) => ({
    dayOfWeek,
    shifts: hours
      .filter((h) => h.dayOfWeek === dayOfWeek && !h.isClosed)
      .sort((a, b) => a.openTime.localeCompare(b.openTime)),
  }));
}
