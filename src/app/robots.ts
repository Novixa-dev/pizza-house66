import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://pizzahouse.ye";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/menu", "/track"],
        disallow: ["/admin", "/kitchen", "/api"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
