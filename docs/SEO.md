# Search Engine Optimization (SEO) & Local Discovery Strategy

## 1. Local Search Intent & Keyword Mapping

The target demographic in Mukalla searches in Arabic primarily, with secondary English queries:

### Primary Arabic Keywords:
- بيتزا هاوس المكلا (Pizza House Mukalla)
- مطعم بيتزا هاوس فوه
- أفضل بيتزا في المكلا (Best pizza in Mukalla)
- منيو بيتزا هاوس المكلا
- فطائر ومعجنات المكلا
- طلب بيتزا مسبق المكلا

### Secondary English Keywords:
- Pizza House Mukalla
- Pizza House Fuwa Masaken
- Order pizza online Mukalla
- Best pizza restaurant Hadhramaut

---

## 2. Structured Data (JSON-LD)

Every public page embeds schema.org `Restaurant` metadata:

```json
{
  "@context": "https://schema.org",
  "@type": "Restaurant",
  "name": "بيتزا هاوس | Pizza House",
  "image": "https://pizzahouse.ye/images/hero-pizza.jpg",
  "@id": "https://pizzahouse.ye/#restaurant",
  "url": "https://pizzahouse.ye",
  "telephone": "+9675375561",
  "servesCuisine": ["Pizza", "Pastries", "Italian", "Middle Eastern"],
  "priceRange": "$$",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "حي المساكن، فوه، بالقرب من جامعة الأحقاف ومستوصف النور",
    "addressLocality": "المكلا (Mukalla)",
    "addressRegion": "حضرموت (Hadhramaut)",
    "addressCountry": "YE"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 14.5321,
    "longitude": 49.1245
  },
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"],
      "opens": "08:00",
      "closes": "12:00"
    },
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "opens": "16:00",
      "closes": "23:30"
    }
  ]
}
```

---

## 3. Metadata, OpenGraph & Twitter Cards

- **Canonical URL tags**: Avoid duplicate content across query parameters.
- **OpenGraph Tags**: Rich previews when shared on WhatsApp, Facebook, and Instagram Direct (`og:title`, `og:description`, `og:image`).
- **Sitemap & Robots.txt**: Automated generation including alternate language hreflang links (`ar` default, `en` secondary).
