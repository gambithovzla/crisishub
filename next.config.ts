import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  images: {
    // Optimización de imágenes (clave para conexiones 2G).
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      // Fotos almacenadas en Supabase Storage.
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
};

export default withNextIntl(nextConfig);
