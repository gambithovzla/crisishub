"use client";

import imageCompression from "browser-image-compression";

import { createClient } from "@/lib/supabase/client";

/**
 * Comprime una imagen en el navegador y la sube al bucket "fotos" de Supabase.
 * Devuelve la URL pública. Optimizado para conexiones lentas (2G):
 * recomprime a WebP, máx ~0.6 MB y 1280px.
 */
export async function compressAndUploadPhoto(
  file: File,
  folder: "desaparecidos" | "tips" | "marcadores",
): Promise<string> {
  const compressed = await imageCompression(file, {
    maxSizeMB: 0.6,
    maxWidthOrHeight: 1280,
    useWebWorker: true,
    fileType: "image/webp",
  });

  const supabase = createClient();
  const path = `${folder}/${crypto.randomUUID()}.webp`;

  const { error } = await supabase.storage.from("fotos").upload(path, compressed, {
    contentType: "image/webp",
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw new Error(error.message);

  return supabase.storage.from("fotos").getPublicUrl(path).data.publicUrl;
}

/**
 * Sube una credencial (foto del diploma/carnet) al bucket PRIVADO "credenciales".
 * Devuelve la RUTA (no una URL pública). Solo el staff puede verla (signed URL).
 */
export async function uploadCredential(file: File): Promise<string> {
  const compressed = await imageCompression(file, {
    maxSizeMB: 1.2,
    maxWidthOrHeight: 2000, // documentos: conservar legibilidad
    useWebWorker: true,
    fileType: "image/webp",
  });

  const supabase = createClient();
  const path = `${crypto.randomUUID()}.webp`;

  const { error } = await supabase.storage
    .from("credenciales")
    .upload(path, compressed, { contentType: "image/webp", upsert: false });
  if (error) throw new Error(error.message);

  return path;
}
