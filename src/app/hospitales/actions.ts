"use server";

import { revalidatePath } from "next/cache";

import { getActiveEvent } from "@/lib/events";
import { createClient } from "@/lib/supabase/server";
import {
  healthFacilitySchema,
  type HealthFacilityInput,
} from "@/lib/validations/health-facility";
import {
  patientRecordSchema,
  type PatientRecordInput,
} from "@/lib/validations/patient-record";
import { checkRateLimit, RATE_LIMIT_MESSAGE } from "@/lib/rate-limit";

export type HealthResult =
  | { ok: true; id?: number }
  | { ok: false; error: string };

const orNull = (s: string) => (s.trim() === "" ? null : s.trim());
const numOrNull = (s: string) => (s.trim() === "" ? null : Number(s));
const intOrNull = (s: string) => {
  const n = Number(s.trim());
  return s.trim() === "" || !Number.isFinite(n) ? null : Math.trunc(n);
};

/** Registra un centro de salud para el evento activo. */
export async function createHealthFacility(
  input: HealthFacilityInput,
): Promise<HealthResult> {
  if (!(await checkRateLimit("facility_create"))) {
    return { ok: false, error: RATE_LIMIT_MESSAGE };
  }
  const parsed = healthFacilitySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Datos inválidos. Revisa el formulario." };
  }
  const v = parsed.data;

  const event = await getActiveEvent();
  if (!event) {
    return { ok: false, error: "No hay un evento activo en este momento." };
  }

  let url = orNull(v.url);
  if (url && !/^https?:\/\//i.test(url)) url = `https://${url}`;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("health_facilities")
    .insert({
      event_id: event.id,
      nombre: v.nombre,
      tipo: v.tipo,
      estado: orNull(v.estado),
      ciudad: orNull(v.ciudad),
      direccion: orNull(v.direccion),
      lat: numOrNull(v.lat),
      lng: numOrNull(v.lng),
      telefono: orNull(v.telefono),
      capacidad: orNull(v.capacidad),
      url,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: "No se pudo registrar. Inténtalo de nuevo." };
  }

  revalidatePath("/hospitales");
  return { ok: true, id: data.id };
}

/** Registra un paciente/herido ingresado en un centro. */
export async function createPatientRecord(
  input: PatientRecordInput,
): Promise<HealthResult> {
  if (!(await checkRateLimit("patient_create"))) {
    return { ok: false, error: RATE_LIMIT_MESSAGE };
  }
  const parsed = patientRecordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Datos inválidos. Revisa el formulario." };
  }
  const v = parsed.data;

  const event = await getActiveEvent();
  if (!event) {
    return { ok: false, error: "No hay un evento activo en este momento." };
  }

  const facilityId = v.facilityId ? Number(v.facilityId) : null;
  const documento =
    v.documentoTipo === "sin_documento" ? null : orNull(v.documento);

  const supabase = await createClient();
  // La tabla no es legible públicamente (RLS), por eso NO encadenamos .select().
  const { error } = await supabase.from("patient_records").insert({
    event_id: event.id,
    facility_id: facilityId,
    facility_nombre: orNull(v.facilityNombre),
    nombre: v.nombre,
    documento_tipo: v.documentoTipo,
    documento,
    edad: intOrNull(v.edad),
    sexo: orNull(v.sexo),
    estado: v.estado,
    notas: orNull(v.notas),
    reportante_nombre: orNull(v.reportanteNombre),
    reportante_contacto: orNull(v.reportanteContacto),
  });

  if (error) {
    return { ok: false, error: "No se pudo registrar. Inténtalo de nuevo." };
  }

  revalidatePath("/hospitales");
  return { ok: true };
}
