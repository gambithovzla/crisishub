import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/entrar"],
    },
    sitemap: "https://vzla.lat/sitemap.xml",
  };
}
