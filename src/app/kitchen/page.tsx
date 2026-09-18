import React from "react";
import { prisma } from "@/lib/prisma";
import KitchenClientView from "./KitchenClientView";

export const dynamic = "force-dynamic";

export default async function KitchenPage() {
  // Query active orders relevant to the kitchen
  const activeOrders = await prisma.order.findMany({
    where: {
      status: {
        in: ["CONFIRMED", "QUEUED", "PREPARING", "READY"],
      },
    },
    include: {
      items: {
        include: {
          options: true,
        },
      },
      payment: true,
    },
    orderBy: {
      requestedPickupTime: "asc",
    },
  });

  return <KitchenClientView initialOrders={activeOrders} />;
}
