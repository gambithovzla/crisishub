"use server";

import { revalidatePath } from "next/cache";

import { getActiveEvent } from "@/lib/events";
import { createClient } from "@/lib/supabase/server";
import {
  missingPersonSchema,
  type MissingPersonInput,
} from "@/lib/validations/missing-person";

export type CreateResult =
  | { ok: true; id: number }
  | { ok: false; error: string };

/** Crea un reporte de persona desaparecida en el evento activo. */
export async function createMissingPerson(
  input: MissingPersonInput,
): Promise<CreateResult> {
  const parsed = missingPersonSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Datos inválidos. Revisa el formulario." };
  }
  const v = parsed.data;

  const event = await getActiveEvent();
  if (!event) {
    return { ok: false, error: "No hay un evento activo en este momento." };
  }

  // Convierte texto → tipos de la base de datos ("" → null).
  const orNull = (s: string) => (s.trim() === "" ? null : s.trim());
  const numOrNull = (s: string) => (s.trim() === "" ? null : Number(s));

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("missing_persons")
    .insert({
      event_id: event.id,
      nombre: v.nombre,
      apellido: v.apellido,
      edad_aprox: numOrNull(v.edad_aprox),
      ciudad: orNull(v.ciudad),
      estado_region: orNull(v.estado_region),
      descripcion: orNull(v.descripcion),
      familiar_nombre: v.familiar_nombre,
      familiar_telefono: v.familiar_telefono,
      ultima_ubicacion_texto: orNull(v.ultima_ubicacion_texto),
      ultima_lat: numOrNull(v.ultima_lat),
      ultima_lng: numOrNull(v.ultima_lng),
      ultimo_contacto_at: v.ultimo_contacto_at
        ? new Date(v.ultimo_contacto_at).toISOString()
        : null,
      ultimo_contacto_medio:
        v.ultimo_contacto_medio === "" ? null : v.ultimo_contacto_medio,
      ultimo_contacto_actividad: orNull(v.ultimo_contacto_actividad),
      foto_url: orNull(v.foto_url),
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: "No se pudo guardar. Inténtalo de nuevo." };
  }

  revalidatePath("/desaparecidos");
  return { ok: true, id: data.id };
}
