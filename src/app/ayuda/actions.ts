"use server";

import { revalidatePath } from "next/cache";

import { getActiveEvent } from "@/lib/events";
import { createClient } from "@/lib/supabase/server";
import {
  helpRequestSchema,
  type HelpRequestInput,
} from "@/lib/validations/help";
import { checkRateLimit, RATE_LIMIT_MESSAGE } from "@/lib/rate-limit";

export type HelpResult =
  | { ok: true; id: number }
  | { ok: false; error: string };

/** Crea una solicitud de ayuda (necesito/ofrezco) en el evento activo. */
export async function createHelpRequest(
  input: HelpRequestInput,
): Promise<HelpResult> {
  if (!(await checkRateLimit("help_create"))) {
    return { ok: false, error: RATE_LIMIT_MESSAGE };
  }
  const parsed = helpRequestSchema.safeParse(input);
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

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("help_requests")
    .insert({
      event_id: event.id,
      modo: v.modo,
      categoria: v.categoria,
      descripcion: v.descripcion,
      ubicacion_texto: orNull(v.ubicacion_texto),
      lat: numOrNull(v.lat),
      lng: numOrNull(v.lng),
      contacto: v.contacto,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: "No se pudo publicar. Inténtalo de nuevo." };
  }

  revalidatePath("/ayuda");
  return { ok: true, id: data.id };
}
