"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/supabase/types";

async function audit(
  accion: string,
  registroId: number,
  detalle?: Record<string, unknown>,
) {
  const profile = await requireAdmin();
  const supabase = await createClient();
  await supabase.from("audit_log").insert({
    actor_id: profile.id,
    accion,
    tabla: "staff_applications",
    registro_id: String(registroId),
    detalle: detalle ?? null,
  });
}

export async function approveStaffApplication(
  applicationId: number,
  rol: UserRole = "moderador",
) {
  const adminProfile = await requireAdmin();
  const admin = createAdminClient();

  const { data: application, error: fetchError } = await admin
    .from("staff_applications")
    .select("*")
    .eq("id", applicationId)
    .maybeSingle();

  if (fetchError || !application) {
    return { ok: false as const, error: "notFound" };
  }
  if (application.estado !== "pendiente") {
    return { ok: false as const, error: "alreadyReviewed" };
  }

  const { data: existingProfile } = await admin
    .from("profiles")
    .select("id")
    .eq("id", application.user_id)
    .maybeSingle();

  if (existingProfile) {
    return { ok: false as const, error: "alreadyStaff" };
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: application.user_id,
    rol,
    nombre: application.nombre,
  });

  if (profileError) {
    return { ok: false as const, error: profileError.message };
  }

  const now = new Date().toISOString();
  const { error: updateError } = await admin
    .from("staff_applications")
    .update({
      estado: "aprobado",
      reviewed_by: adminProfile.id,
      reviewed_at: now,
    })
    .eq("id", applicationId);

  if (updateError) {
    return { ok: false as const, error: updateError.message };
  }

  await audit("approve_staff", applicationId, {
    user_id: application.user_id,
    rol,
  });
  revalidatePath("/admin/solicitudes");
  return { ok: true as const };
}

export async function rejectStaffApplication(applicationId: number) {
  const adminProfile = await requireAdmin();
  const admin = createAdminClient();

  const { data: application } = await admin
    .from("staff_applications")
    .select("estado")
    .eq("id", applicationId)
    .maybeSingle();

  if (!application) {
    return { ok: false as const, error: "notFound" };
  }
  if (application.estado !== "pendiente") {
    return { ok: false as const, error: "alreadyReviewed" };
  }

  const { error } = await admin
    .from("staff_applications")
    .update({
      estado: "rechazado",
      reviewed_by: adminProfile.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", applicationId);

  if (error) {
    return { ok: false as const, error: error.message };
  }

  await audit("reject_staff", applicationId);
  revalidatePath("/admin/solicitudes");
  return { ok: true as const };
}
