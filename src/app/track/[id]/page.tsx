import React from "react";
import { timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import TrackingClientView from "./TrackingClientView";
import type { OrderStatus } from "@/types";

export const dynamic = "force-dynamic";

/**
 * Constant-time string comparison.
 *
 * A plain `===` on a secret leaks its prefix through response timing, which
 * lets an attacker recover the token character by character. Lengths are
 * compared first because timingSafeEqual throws on mismatched buffer lengths.
 */
function tokensMatch(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export default async function OrderTrackingPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { token?: string };
}) {
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      items: { include: { options: true } },
      payment: { include: { receipt: true } },
    },
  });

  // An order id alone must never grant access. Ids are cuids, but obscurity is
  // not authorization — without this check anyone who guesses or is passed an
  // id can read another customer's name, phone number and payment details.
  // See PRD §41.
  if (!order || !searchParams.token || !tokensMatch(searchParams.token, order.trackingToken)) {
    notFound();
  }

  // The receipt image is payment evidence and is never needed by the customer
  // viewing their own status, so it is dropped before reaching the client.
  const { payment, ...rest } = order;
  const safeOrder = {
    ...rest,
    // SQLite has no enum type, so Prisma widens status to `string`. The set of
    // values is constrained by the application, not the database -- another
    // reason the status transitions need a real state machine guard.
    status: rest.status as OrderStatus,
    payment: payment
      ? {
          method: payment.method,
          status: payment.status,
          amount: payment.amount,
          rejectReason: payment.rejectReason,
        }
      : null,
  };

  return <TrackingClientView order={safeOrder} />;
}
