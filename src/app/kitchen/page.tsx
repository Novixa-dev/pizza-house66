import React from "react";
import { prisma } from "@/lib/prisma";
import KitchenClientView from "./KitchenClientView";
import { getStaffSession } from "@/lib/auth";
import StaffAuthModal from "@/components/shared/StaffAuthModal";

export const dynamic = "force-dynamic";

export default async function KitchenPage() {
  const session = getStaffSession();

  if (
    !session.isAuthenticated ||
    !session.role ||
    !["ADMIN", "KITCHEN"].includes(session.role)
  ) {
    return (
      <StaffAuthModal
        requiredRole="KITCHEN"
        titleAr="شاشة المطبخ المباشرة (KDS)"
        titleEn="Kitchen Display System (KDS)"
        descriptionAr="يرجى إدخال الرمز السري لطاقم المطبخ لمتابعة تذاكر الخبز والتحضير."
        descriptionEn="Please enter Kitchen PIN to view live preparation and baking tickets."
      />
    );
  }

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
