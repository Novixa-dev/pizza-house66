"use server";

import { prisma } from "@/lib/prisma";
import { z } from "zod";

/**
 * Looks up an order for the customer-facing tracking page.
 *
 * Requires BOTH the order number and the phone number on the order. The order
 * number alone is a short, guessable, sequential reference (`#PH-1024`) and
 * must never by itself unlock a customer's name, phone and payment details.
 *
 * On success the caller receives the order's opaque id and tracking token,
 * which together form the real capability URL.
 */

const LookupSchema = z.object({
  orderNumber: z.string().min(1).max(32),
  phone: z.string().min(6).max(20),
});

export interface LookupResult {
  success: boolean;
  orderId?: string;
  token?: string;
  error?: string;
}

/** Strips formatting and the Yemeni country code so entries compare equal. */
function normalisePhone(raw: string): string {
  let digits = raw.replace(/[^0-9]/g, "");
  if (digits.startsWith("967")) digits = digits.slice(3);
  // Yemeni mobile numbers are commonly written with a leading 0 ("0771234567")
  // but stored without it, so strip it after the country code.
  return digits.replace(/^0+/, "");
}

export async function lookupOrderAction(
  rawOrderNumber: string,
  rawPhone: string
): Promise<LookupResult> {
  const parsed = LookupSchema.safeParse({
    orderNumber: rawOrderNumber,
    phone: rawPhone,
  });
  if (!parsed.success) {
    return { success: false, error: "INVALID_INPUT" };
  }

  // Accept "1024", "PH-1024" and "#PH-1024" alike.
  const digits = parsed.data.orderNumber.replace(/[^0-9]/g, "");
  if (!digits) return { success: false, error: "NOT_FOUND" };

  try {
    const order = await prisma.order.findUnique({
      where: { orderNumber: `#PH-${digits}` },
      select: { id: true, trackingToken: true, customerPhone: true },
    });

    // One generic failure for "no such order" and "wrong phone" alike: a
    // distinguishable response would turn this into an order-number oracle.
    if (
      !order ||
      normalisePhone(order.customerPhone) !== normalisePhone(parsed.data.phone)
    ) {
      return { success: false, error: "NOT_FOUND" };
    }

    return { success: true, orderId: order.id, token: order.trackingToken };
  } catch {
    return { success: false, error: "NOT_FOUND" };
  }
}
