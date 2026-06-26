"use server";

import { revalidatePath } from "next/cache";

import { getActiveEvent } from "@/lib/events";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, RATE_LIMIT_MESSAGE } from "@/lib/rate-limit";
import { verifyCaptcha, CAPTCHA_ERROR } from "@/lib/captcha";
import {
  volunteerSchema,
  type VolunteerInput,
} from "@/lib/validations/volunteer";

export type VolunteerResult = { ok: true } | { ok: false; error: string };

/** Registra un profesional voluntario (queda sin verificar hasta revisión del staff). */
export async function createVolunteer(
  input: VolunteerInput,
  captchaToken: string,
): Promise<VolunteerResult> {
  if (!(await checkRateLimit("volunteer_create"))) {
    return { ok: false, error: RATE_LIMIT_MESSAGE };
  }
  if (!(await verifyCaptcha(captchaToken))) {
    return { ok: false, error: CAPTCHA_ERROR };
  }

  const parsed = volunteerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Datos inválidos. Revisa el formulario." };
  }
  const v = parsed.data;

  const event = await getActiveEvent();
  if (!event) {
    return { ok: false, error: "No hay un evento activo en este momento." };
  }

  const orNull = (s: string) => (s.trim() === "" ? null : s.trim());

  // No encadenamos .select(): la tabla no es legible por el público (solo staff),
  // así que un RETURNING fallaría la RLS. Basta con comprobar el error.
  const supabase = await createClient();
  const { error } = await supabase.from("volunteers").insert({
    event_id: event.id,
    nombre: v.nombre,
    profesion: v.profesion,
    especialidad: orNull(v.especialidad),
    modalidades: v.modalidades,
    zona: orNull(v.zona),
    idiomas: orNull(v.idiomas),
    bio: orNull(v.bio),
    contacto: v.contacto,
    colegio_numero: orNull(v.colegio_numero),
    credencial_path: orNull(v.credencial_path),
  });

  if (error) {
    return { ok: false, error: "No se pudo registrar. Inténtalo de nuevo." };
  }

  revalidatePath("/profesionales");
  return { ok: true };
}
