import React from "react";
import { prisma } from "@/lib/prisma";
import AdminClientView from "./AdminClientView";
import { getStaffSession } from "@/lib/auth";
import StaffAuthModal from "@/components/shared/StaffAuthModal";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = getStaffSession();

  if (!session.isAuthenticated || session.role !== "ADMIN") {
    return (
      <StaffAuthModal
        requiredRole="ADMIN"
        titleAr="لوحة الإدارة والتحكم"
        titleEn="Manager Control Center"
        descriptionAr="يرجى إدخال الرمز السري للإدارة للوصول إلى لوحة المبيعات والعمليات."
        descriptionEn="Please enter Admin PIN to access management and order controls."
      />
    );
  }

  const restaurant = await prisma.restaurant.findFirst({
    include: { businessHours: true },
  });

  const orders = await prisma.order.findMany({
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
    orderBy: {
      createdAt: "desc",
    },
  });

  const products = await prisma.product.findMany({
    include: {
      category: true,
    },
    orderBy: {
      sortOrder: "asc",
    },
  });

  return (
    <AdminClientView
      restaurant={restaurant}
      orders={orders}
      products={products}
    />
  );
}
