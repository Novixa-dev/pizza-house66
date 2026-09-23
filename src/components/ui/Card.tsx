import React from "react";
import { cn } from "@/lib/cn";

/**
 * A surface that groups related content.
 *
 * `interactive` is opt-in: a card that merely displays information should not
 * animate on hover, because hover feedback promises a click that isn't there.
 */
export function Card({
  interactive = false,
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return (
    <div
      className={cn(
        "bg-surface border border-subtle rounded-card",
        interactive &&
          "transition-colors hover:border-strong cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/** Constrains page content to a readable measure with consistent gutters. */
export function Container({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * A titled page section. Keeping the heading/description pairing in one
 * component is what stops six pages inventing six heading sizes.
 */
export function Section({
  title,
  description,
  action,
  className,
  children,
  ...props
}: Omit<React.HTMLAttributes<HTMLElement>, "title"> & {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className={cn("space-y-5", className)} {...props}>
      {(title || action) && (
        <div className="flex items-end justify-between gap-4">
          <div className="space-y-1">
            {title && (
              <h2 className="text-2xl font-bold tracking-tight text-content">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-sm text-content-secondary">{description}</p>
            )}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

/**
 * Shown when a list has nothing in it. An unexplained blank region reads as a
 * bug; this names the state and offers the way out.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        "px-6 py-14 rounded-card border border-dashed border-default",
        "bg-surface-sunken/50",
        className
      )}
    >
      {Icon && (
        <Icon className="w-9 h-9 text-content-muted mb-3" aria-hidden="true" />
      )}
      <p className="text-base font-semibold text-content">{title}</p>
      {description && (
        <p className="mt-1 text-sm text-content-secondary max-w-sm">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
