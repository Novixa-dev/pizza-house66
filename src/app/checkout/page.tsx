import React from "react";
import { prisma } from "@/lib/prisma";
import CheckoutClientView from "./CheckoutClientView";
import { generatePickupSlots } from "@/lib/scheduler";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const restaurant = await prisma.restaurant.findFirst({
    include: { businessHours: true },
  });

  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  // Fetch today's orders to calculate slot capacities
  const todayOrders = await prisma.order.findMany({
    where: {
      requestedPickupTime: {
        gte: startOfDay,
        lte: endOfDay,
      },
      status: {
        notIn: ["CANCELLED", "REJECTED"],
      },
    },
    select: {
      requestedPickupTime: true,
    },
  });

  const slotCounts: Record<string, number> = {};
  todayOrders.forEach((o) => {
    const h = String(o.requestedPickupTime.getHours()).padStart(2, "0");
    const m = String(o.requestedPickupTime.getMinutes()).padStart(2, "0");
    const key = `${h}:${m}`;
    slotCounts[key] = (slotCounts[key] || 0) + 1;
  });

  const slots = restaurant
    ? generatePickupSlots({
        targetDate: now,
        businessHours: restaurant.businessHours,
        existingSlotOrdersCount: slotCounts,
        slotCapacityMax: restaurant.slotCapacityMax,
        now,
      })
    : [];

  return (
    <CheckoutClientView
      restaurant={restaurant}
      availableSlots={slots}
    />
  );
}
