"use server";

import { revalidatePath } from "next/cache";

import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ModerationStatus } from "@/lib/supabase/types";

async function audit(
  accion: string,
  id: number,
  detalle?: Record<string, unknown>,
) {
  const profile = await requireStaff();
  const supabase = await createClient();
  await supabase.from("audit_log").insert({
    actor_id: profile.id,
    accion,
    tabla: "volunteers",
    registro_id: String(id),
    detalle: detalle ?? null,
  });
}

function revalidate() {
  revalidatePath("/admin/voluntarios");
  revalidatePath("/profesionales");
}

/** Marca/desmarca un profesional como verificado. */
export async function setVerified(id: number, verified: boolean) {
  await requireStaff();
  const supabase = await createClient();
  const { error } = await supabase
    .from("volunteers")
    .update({ verified })
    .eq("id", id);
  if (error) return { ok: false as const, error: error.message };
  await audit("set_verified", id, { verified });
  revalidate();
  return { ok: true as const };
}

export async function setVolunteerModeration(
  id: number,
  moderation: ModerationStatus,
) {
  await requireStaff();
  const supabase = await createClient();
  const { error } = await supabase
    .from("volunteers")
    .update({ moderation })
    .eq("id", id);
  if (error) return { ok: false as const, error: error.message };
  await audit("set_moderation", id, { moderation });
  revalidate();
  return { ok: true as const };
}

export async function removeVolunteer(id: number) {
  await requireStaff();
  const supabase = await createClient();
  const { error } = await supabase.from("volunteers").delete().eq("id", id);
  if (error) return { ok: false as const, error: error.message };
  await audit("delete", id);
  revalidate();
  return { ok: true as const };
}

/** Genera un enlace temporal (firmado) para que el staff vea la credencial privada. */
export async function getCredentialUrl(id: number) {
  await requireStaff();
  const supabase = await createClient();
  const { data: vol } = await supabase
    .from("volunteers")
    .select("credencial_path")
    .eq("id", id)
    .maybeSingle();
  if (!vol?.credencial_path) {
    return { ok: false as const, error: "Este registro no tiene credencial." };
  }
  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from("credenciales")
    .createSignedUrl(vol.credencial_path, 300);
  if (error || !data) {
    return { ok: false as const, error: "No se pudo generar el enlace." };
  }
  return { ok: true as const, url: data.signedUrl };
}
