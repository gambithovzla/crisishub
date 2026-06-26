"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getPostLoginPath } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isStaffInviteValid } from "@/lib/staff-invite";

export async function getPostLoginPathAction(next?: string) {
  return getPostLoginPath(next);
}

export type StaffSignupState = {
  ok: boolean;
  error?: string;
};

export async function submitStaffApplication(
  _prev: StaffSignupState,
  formData: FormData,
): Promise<StaffSignupState> {
  const invite = String(formData.get("invite") ?? "");
  if (!isStaffInviteValid(invite)) {
    return { ok: false, error: "inviteInvalid" };
  }

  const nombre = String(formData.get("nombre") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  const mensaje = String(formData.get("mensaje") ?? "").trim() || null;

  if (!nombre || nombre.length < 2) {
    return { ok: false, error: "nombreInvalid" };
  }
  if (!email || !email.includes("@")) {
    return { ok: false, error: "emailInvalid" };
  }
  if (password.length < 8) {
    return { ok: false, error: "passwordShort" };
  }
  if (password !== confirm) {
    return { ok: false, error: "passwordMismatch" };
  }

  const admin = createAdminClient();
  const { data: created, error: createError } =
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nombre },
    });

  if (createError || !created.user) {
    const msg = createError?.message ?? "";
    if (msg.toLowerCase().includes("already")) {
      return { ok: false, error: "emailTaken" };
    }
    return { ok: false, error: "signupFailed" };
  }

  const userId = created.user.id;
  const { error: appError } = await admin.from("staff_applications").insert({
    user_id: userId,
    email,
    nombre,
    mensaje,
    estado: "pendiente",
  });

  if (appError) {
    await admin.auth.admin.deleteUser(userId);
    return { ok: false, error: "signupFailed" };
  }

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    redirect("/entrar");
  }

  revalidatePath("/admin/solicitudes");
  redirect("/entrar/pendiente");
}
