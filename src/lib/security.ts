// Solo aceptamos fotos subidas a NUESTRO bucket público de Supabase Storage.
// Esto evita que alguien inyecte una URL externa (SSRF / contenido malicioso).
const PHOTO_PREFIX = `${process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""}/storage/v1/object/public/fotos/`;

export function isOwnPhotoUrl(url: string): boolean {
  return url.startsWith(PHOTO_PREFIX);
}

/** Devuelve la URL si es una foto válida de nuestro Storage; si no, null. */
export function cleanPhotoUrl(url: string | null | undefined): string | null {
  const u = (url ?? "").trim();
  if (u === "") return null;
  return isOwnPhotoUrl(u) ? u : null;
}
