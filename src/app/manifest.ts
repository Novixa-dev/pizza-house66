import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "بيتزا هاوس المكلا | Pizza House",
    short_name: "بيتزا هاوس",
    description: "اطلب أشهى بيتزا إيطالية وفطائر طازجة مسبقاً بدون انتظار في المكلا - فوه",
    start_url: "/",
    display: "standalone",
    background_color: "#121214",
    theme_color: "#c2410c",
    lang: "ar",
    dir: "rtl",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
