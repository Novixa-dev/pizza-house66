import React from "react";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import TrackingClientView from "./TrackingClientView";

export const dynamic = "force-dynamic";

export default async function OrderTrackingPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { token?: string };
}) {
  const cleanParam = decodeURIComponent(params.id || "").trim();
  const withHash = cleanParam.startsWith("#") ? cleanParam : `#${cleanParam}`;
  const withoutHash = cleanParam.replace(/^#/, "");

  const order = await prisma.order.findFirst({
    where: {
      OR: [
        { id: cleanParam },
        { orderNumber: cleanParam },
        { orderNumber: withHash },
        { orderNumber: withoutHash },
        { trackingToken: cleanParam },
      ],
    },
    include: {
      items: {
        include: {
          options: true,
        },
      },
      payment: {
        include: {
          receipt: true,
        },
      },
    },
  });

  if (!order) {
    notFound();
  }

  // If customer phone is present, mask it for privacy (e.g. 77****788)
  const maskedOrder = {
    ...order,
    customerPhone: order.customerPhone.replace(/(\d{2})\d+(\d{3})/, "$1****$2"),
  };

  return <TrackingClientView order={maskedOrder} />;
}
