import React from "react";
import { prisma } from "@/lib/prisma";
import MenuClientView from "./MenuClientView";

export const revalidate = 60;

export default async function MenuPage() {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: {
      products: {
        where: { isAvailable: true },
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

  return <MenuClientView categories={categories} />;
}
