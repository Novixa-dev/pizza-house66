import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges class names, letting later Tailwind utilities win over earlier ones.
 * Without twMerge, a `className` prop passed to a component cannot override the
 * component's own defaults — the two classes both land in the DOM and the
 * winner is decided by stylesheet order rather than by intent.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
