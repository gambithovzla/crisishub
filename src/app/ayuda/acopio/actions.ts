"use server";

import { revalidatePath } from "next/cache";

import { getActiveEvent } from "@/lib/events";
import { createClient } from "@/lib/supabase/server";
import {
  collectionPointSchema,
  type CollectionPointInput,
} from "@/lib/validations/collection-point";

export type AcopioResult =
  | { ok: true; id: number }
  | { ok: false; error: string };

/** Registra un centro de acopio internacional para el evento activo. */
export async function createCollectionPoint(
  input: CollectionPointInput,
): Promise<AcopioResult> {
  const parsed = collectionPointSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Datos inválidos. Revisa el formulario." };
  }
  const v = parsed.data;

  const event = await getActiveEvent();
  if (!event) {
    return { ok: false, error: "No hay un evento activo en este momento." };
  }

  const orNull = (s: string) => (s.trim() === "" ? null : s.trim());
  const numOrNull = (s: string) => (s.trim() === "" ? null : Number(s));

  // Normaliza la URL (añade https:// si falta).
  let url = orNull(v.url);
  if (url && !/^https?:\/\//i.test(url)) url = `https://${url}`;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("collection_points")
    .insert({
      event_id: event.id,
      pais: v.pais,
      ciudad: orNull(v.ciudad),
      nombre: v.nombre,
      direccion: orNull(v.direccion),
      lat: numOrNull(v.lat),
      lng: numOrNull(v.lng),
      categorias: v.categorias,
      instrucciones: orNull(v.instrucciones),
      horario: orNull(v.horario),
      contacto: orNull(v.contacto),
      url,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: "No se pudo registrar. Inténtalo de nuevo." };
  }

  revalidatePath("/ayuda/acopio");
  return { ok: true, id: data.id };
}
