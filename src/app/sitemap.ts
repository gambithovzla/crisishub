import type { MetadataRoute } from "next";

const BASE = "https://vzla.lat";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/desaparecidos",
    "/buscar",
    "/mapa",
    "/ayuda",
    "/ayuda/acopio",
    "/hospitales",
  ];
  const now = new Date();
  return routes.map((r) => ({
    url: `${BASE}${r}`,
    lastModified: now,
    changeFrequency: "hourly",
    priority: r === "" ? 1 : 0.8,
  }));
}
