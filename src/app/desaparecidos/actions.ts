"use server";

import { revalidatePath } from "next/cache";

import { getActiveEvent } from "@/lib/events";
import { createClient } from "@/lib/supabase/server";
import {
  missingPersonSchema,
  type MissingPersonInput,
} from "@/lib/validations/missing-person";
import { tipSchema, type TipInput } from "@/lib/validations/tip";
import { checkRateLimit, RATE_LIMIT_MESSAGE } from "@/lib/rate-limit";
import { verifyCaptcha, CAPTCHA_ERROR } from "@/lib/captcha";
import { cleanPhotoUrl } from "@/lib/security";
import type { DuplicateCandidate } from "@/lib/supabase/types";

const orNull = (s: string) => (s.trim() === "" ? null : s.trim());
const numOrNull = (s: string) => (s.trim() === "" ? null : Number(s));
const digitsOrNull = (s: string) => {
  const d = (s ?? "").replace(/\D/g, "");
  return d === "" ? null : d;
};

export type CreateResult =
  | { ok: true; id: number }
  | { ok: false; error: string };

/** Crea un reporte de persona desaparecida en el evento activo. */
export async function createMissingPerson(
  input: MissingPersonInput,
  captchaToken: string,
): Promise<CreateResult> {
  if (!(await checkRateLimit("missing_create"))) {
    return { ok: false, error: RATE_LIMIT_MESSAGE };
  }
  if (!(await verifyCaptcha(captchaToken))) {
    return { ok: false, error: CAPTCHA_ERROR };
  }
  const parsed = missingPersonSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Datos inválidos. Revisa el formulario." };
  }
  const v = parsed.data;

  const event = await getActiveEvent();
  if (!event) {
    return { ok: false, error: "No hay un evento activo en este momento." };
  }

  // Convierte texto → tipos de la base de datos ("" → null) con orNull/numOrNull.
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
      documento: digitsOrNull(v.documento),
      ultima_ubicacion_texto: orNull(v.ultima_ubicacion_texto),
      ultima_lat: numOrNull(v.ultima_lat),
      ultima_lng: numOrNull(v.ultima_lng),
      ultimo_contacto_at: v.ultimo_contacto_at
        ? new Date(v.ultimo_contacto_at).toISOString()
        : null,
      ultimo_contacto_medio:
        v.ultimo_contacto_medio === "" ? null : v.ultimo_contacto_medio,
      ultimo_contacto_actividad: orNull(v.ultimo_contacto_actividad),
      foto_url: cleanPhotoUrl(v.foto_url),
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: "No se pudo guardar. Inténtalo de nuevo." };
  }

  revalidatePath("/desaparecidos");
  return { ok: true, id: data.id };
}

export type TipResult = { ok: true } | { ok: false; error: string };

/** Crea una pista ("Tengo información") asociada a una persona desaparecida. */
export async function createTip(
  personId: number,
  input: TipInput,
  captchaToken: string,
): Promise<TipResult> {
  if (!(await checkRateLimit("tip_create"))) {
    return { ok: false, error: RATE_LIMIT_MESSAGE };
  }
  if (!(await verifyCaptcha(captchaToken))) {
    return { ok: false, error: CAPTCHA_ERROR };
  }
  const parsed = tipSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Datos inválidos. Revisa el formulario." };
  }
  if (!Number.isInteger(personId) || personId < 1) {
    return { ok: false, error: "Ficha no válida." };
  }
  const v = parsed.data;

  const supabase = await createClient();

  // La persona debe existir y ser visible (RLS solo devuelve lo visible).
  const { data: person } = await supabase
    .from("missing_persons")
    .select("id")
    .eq("id", personId)
    .maybeSingle();
  if (!person) {
    return { ok: false, error: "No encontramos esa ficha." };
  }

  const { error } = await supabase.from("tips").insert({
    missing_person_id: personId,
    informacion: v.informacion,
    nombre: orNull(v.nombre),
    telefono: orNull(v.telefono),
    ubicacion_texto: orNull(v.ubicacion_texto),
    lat: numOrNull(v.lat),
    lng: numOrNull(v.lng),
    foto_url: cleanPhotoUrl(v.foto_url),
  });
  if (error) {
    return { ok: false, error: "No se pudo enviar. Inténtalo de nuevo." };
  }

  revalidatePath(`/desaparecidos/${personId}`);
  return { ok: true };
}

/**
 * Busca reportes existentes que probablemente sean la misma persona, para
 * evitar duplicados: match exacto por documento o nombre muy parecido.
 */
export async function buscarPosiblesDuplicados(input: {
  documento: string;
  nombre: string;
  apellido: string;
}): Promise<DuplicateCandidate[]> {
  const documento = (input.documento ?? "").replace(/\D/g, "");
  const nombre = (input.nombre ?? "").trim();
  const apellido = (input.apellido ?? "").trim();

  // Sin datos suficientes no buscamos.
  if (documento === "" && nombre === "" && apellido === "") return [];

  const event = await getActiveEvent();
  if (!event) return [];

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("posibles_duplicados", {
    p_event_id: event.id,
    p_documento: documento,
    p_nombre: nombre,
    p_apellido: apellido,
  });
  if (error || !data) return [];
  return data as DuplicateCandidate[];
}
