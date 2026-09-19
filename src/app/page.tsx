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

  const restaurantSchema = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: "بيتزا هاوس | Pizza House Mukalla",
    image: "https://pizzahouse.ye/hero-pizza.jpg",
    "@id": "https://pizzahouse.ye/#restaurant",
    url: "https://pizzahouse.ye",
    telephone: "+9675375561",
    servesCuisine: ["Pizza", "Pastries", "Italian", "Middle Eastern"],
    priceRange: "$$",
    address: {
      "@type": "PostalAddress",
      streetAddress: "حي المساكن، فوه، بالقرب من جامعة الأحقاف ومستوصف النور",
      addressLocality: "المكلا (Mukalla)",
      addressRegion: "حضرموت (Hadhramaut)",
      addressCountry: "YE",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 14.5321,
      longitude: 49.1245,
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Saturday",
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
        ],
        opens: "08:00",
        closes: "12:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Saturday",
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
        ],
        opens: "16:00",
        closes: "23:30",
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(restaurantSchema) }}
      />
      <HomeClientView
        restaurant={restaurant}
        featuredProducts={restaurant?.products || []}
        categories={restaurant?.categories || []}
      />
    </>
  );
}
