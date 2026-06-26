import type { MetadataRoute } from "next";

// Manifest PWA — instalable y optimizado para uso offline/2G.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Venezuela hub — Información de emergencia",
    short_name: "Venezuela hub",
    description:
      "Plataforma ciudadana de respuesta rápida ante desastres naturales.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#1d70b8",
    lang: "es",
    dir: "ltr",
    categories: ["utilities", "social"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
