import React from "react";
import { prisma } from "@/lib/prisma";
import AdminClientView from "./AdminClientView";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
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
