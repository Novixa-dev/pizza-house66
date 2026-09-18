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
  const order = await prisma.order.findUnique({
    where: { id: params.id },
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

  return <TrackingClientView order={order} />;
}
