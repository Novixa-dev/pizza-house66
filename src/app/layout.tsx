import type { Metadata } from "next";
import { Cairo, Outfit } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import CartDrawer from "@/components/customer/CartDrawer";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "بيتزا هاوس المكلا | Pizza House Mukalla - اطلب واستلم مسبقاً",
  description:
    "مطعم بيتزا هاوس في فوه، حي المساكن، المكلا. اطلب مسبقاً وحدد موعد استلامك واستلم أشهى بيتزا إيطالية وفطائر طازجة بدون انتظار.",
  keywords: [
    "بيتزا هاوس",
    "بيتزا المكلا",
    "مطعم بيتزا فوه",
    "Pizza House Mukalla",
    "فطائر المكلا",
    "طلب بيتزا مسبق حضرموت",
  ],
  authors: [{ name: "Pizza House Mukalla" }],
  openGraph: {
    title: "بيتزا هاوس | Pizza House Mukalla",
    description: "اطلب مسبقاً وتجنب الانتظار - طعم البيتزا الحقيقي والمخبوزات الطازجة في المكلا.",
    url: "https://pizzahouse.ye",
    siteName: "بيتزا هاوس",
    locale: "ar_YE",
    type: "website",
  },
};

/**
 * Runs before first paint, so the page never flashes the wrong theme or the
 * wrong text direction. Kept as a raw string because it must execute
 * synchronously in <head> — a React effect runs too late and the flash is
 * visible. Mirrors the storage keys used by AppContext.
 */
const themeAndDirectionScript = `
(function () {
  try {
    var t = localStorage.getItem("ph_theme");
    if (t === "dark" || (!t && matchMedia("(prefers-color-scheme: dark)").matches)) {
      document.documentElement.classList.add("dark");
    }
    var l = localStorage.getItem("ph_lang");
    if (l === "en") {
      document.documentElement.lang = "en";
      document.documentElement.dir = "ltr";
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} ${outfit.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeAndDirectionScript }} />
      </head>
      <body className="font-cairo antialiased min-h-screen flex flex-col selection:bg-pizza-500 selection:text-white">
        <AppProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <CartDrawer />
        </AppProvider>
      </body>
    </html>
  );
}
