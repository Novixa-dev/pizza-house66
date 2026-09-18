import React from "react";
import { prisma } from "@/lib/prisma";
import HomeClientView from "./HomeClientView";

export const revalidate = 60; // ISR cache revalidation every minute

export default async function HomePage() {
  const restaurant = await prisma.restaurant.findFirst({
    include: {
      businessHours: true,
      categories: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      },
      products: {
        where: { isAvailable: true, isFeatured: true },
        include: {
          optionGroups: {
            include: {
              options: true,
            },
          },
        },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  return (
    <HomeClientView
      restaurant={restaurant}
      featuredProducts={restaurant?.products || []}
      categories={restaurant?.categories || []}
    />
  );
}
