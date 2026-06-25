"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type {
  HelpStatus,
  ModerationStatus,
  PersonStatus,
} from "@/lib/supabase/types";

type ModerableTable =
  | "missing_persons"
  | "tips"
  | "map_markers"
  | "help_requests"
  | "collection_points";

const SECTION: Record<ModerableTable, { admin: string; publicPaths: string[] }> =
  {
    missing_persons: { admin: "/admin/desaparecidos", publicPaths: ["/desaparecidos", "/buscar"] },
    tips: { admin: "/admin/pistas", publicPaths: ["/desaparecidos"] },
    map_markers: { admin: "/admin/mapa", publicPaths: ["/mapa"] },
    help_requests: { admin: "/admin/ayuda", publicPaths: ["/ayuda"] },
    collection_points: { admin: "/admin/acopio", publicPaths: ["/ayuda/acopio"] },
  };

function revalidateFor(table: ModerableTable) {
  revalidatePath(SECTION[table].admin);
  for (const p of SECTION[table].publicPaths) revalidatePath(p);
}

async function audit(
  accion: string,
  tabla: string,
  registroId: number,
  detalle?: Record<string, unknown>,
) {
  const profile = await requireStaff();
  const supabase = await createClient();
  await supabase.from("audit_log").insert({
    actor_id: profile.id,
    accion,
    tabla,
    registro_id: String(registroId),
    detalle: detalle ?? null,
  });
}

/** Cambia el estado de moderación (visible/hidden/false_info) de cualquier tabla. */
export async function setModeration(
  table: ModerableTable,
  id: number,
  moderation: ModerationStatus,
) {
  await requireStaff();
  const supabase = await createClient();
  const { error } = await supabase
    .from(table)
    .update({ moderation })
    .eq("id", id);
  if (error) return { ok: false as const, error: error.message };
  await audit("set_moderation", table, id, { moderation });
  revalidateFor(table);
  return { ok: true as const };
}

/** Elimina definitivamente un registro. */
export async function removeRecord(table: ModerableTable, id: number) {
  await requireStaff();
  const supabase = await createClient();
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) return { ok: false as const, error: error.message };
  await audit("delete", table, id);
  revalidateFor(table);
  return { ok: true as const };
}

/** Cambia la situación de una persona (desaparecido/encontrado/fallecido). */
export async function setMissingEstado(id: number, estado: PersonStatus) {
  await requireStaff();
  const supabase = await createClient();
  const { error } = await supabase
    .from("missing_persons")
    .update({ estado })
    .eq("id", id);
  if (error) return { ok: false as const, error: error.message };
  await audit("set_estado", "missing_persons", id, { estado });
  revalidateFor("missing_persons");
  revalidatePath(`/desaparecidos/${id}`);
  return { ok: true as const };
}

/** Fusiona la persona `sourceId` dentro de `targetId` (marca la fuente como duplicada). */
export async function mergeMissing(sourceId: number, targetId: number) {
  await requireStaff();
  if (sourceId === targetId) {
    return { ok: false as const, error: "No puedes fusionar una ficha consigo misma." };
  }
  const supabase = await createClient();
  const { data: target } = await supabase
    .from("missing_persons")
    .select("id")
    .eq("id", targetId)
    .maybeSingle();
  if (!target) {
    return { ok: false as const, error: "La ficha destino no existe." };
  }
  const { error } = await supabase
    .from("missing_persons")
    .update({ merged_into_id: targetId, moderation: "merged" })
    .eq("id", sourceId);
  if (error) return { ok: false as const, error: error.message };
  await audit("merge", "missing_persons", sourceId, { into: targetId });
  revalidateFor("missing_persons");
  return { ok: true as const };
}

/** Cambia el estado de una solicitud de ayuda. */
export async function setHelpEstado(id: number, estado: HelpStatus) {
  await requireStaff();
  const supabase = await createClient();
  const { error } = await supabase
    .from("help_requests")
    .update({ estado })
    .eq("id", id);
  if (error) return { ok: false as const, error: error.message };
  await audit("set_help_estado", "help_requests", id, { estado });
  revalidateFor("help_requests");
  return { ok: true as const };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/entrar");
}
