/**
 * URL pública del sitio, para construir enlaces limpios para compartir
 * (WhatsApp, redes, etc.). Configurable con NEXT_PUBLIC_SITE_URL en Vercel.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://vzla.lat"
).replace(/\/$/, "");

/** Construye una URL absoluta a partir de una ruta relativa ("/desaparecidos/1"). */
export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
