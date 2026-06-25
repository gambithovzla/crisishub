"use server";

import { revalidatePath } from "next/cache";

import { getActiveEvent } from "@/lib/events";
import { createClient } from "@/lib/supabase/server";
import { markerSchema, type MarkerInput } from "@/lib/validations/marker";

export type MarkerResult =
  | { ok: true; id: number }
  | { ok: false; error: string };

/** Crea un marcador en el mapa del evento activo. */
export async function createMarker(
  input: MarkerInput,
): Promise<MarkerResult> {
  const parsed = markerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Datos inválidos. Revisa el formulario." };
  }
  const v = parsed.data;

  const event = await getActiveEvent();
  if (!event) {
    return { ok: false, error: "No hay un evento activo en este momento." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("map_markers")
    .insert({
      event_id: event.id,
      tipo: v.tipo,
      descripcion: v.descripcion.trim() === "" ? null : v.descripcion.trim(),
      usuario: v.usuario.trim() === "" ? null : v.usuario.trim(),
      lat: Number(v.lat),
      lng: Number(v.lng),
      foto_url: v.foto_url.trim() === "" ? null : v.foto_url.trim(),
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: "No se pudo guardar. Inténtalo de nuevo." };
  }

  revalidatePath("/mapa");
  return { ok: true, id: data.id };
}
