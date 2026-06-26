import { cache } from "react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { Profile, StaffApplication } from "@/lib/supabase/types";

/** Usuario autenticado (o null). */
export const getUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/** Perfil de staff del usuario actual (o null si no es staff). */
export const getProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  return data ?? null;
});

/** Solicitud de staff del usuario actual (o null). */
export const getStaffApplication = cache(
  async (): Promise<StaffApplication | null> => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await supabase
      .from("staff_applications")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    return data ?? null;
  },
);

/** Ruta tras iniciar sesión según perfil o solicitud pendiente. */
export async function getPostLoginPath(next?: string): Promise<string> {
  const profile = await getProfile();
  if (profile) {
    if (next?.startsWith("/admin")) return next;
    return "/admin";
  }

  const application = await getStaffApplication();
  if (
    application?.estado === "pendiente" ||
    application?.estado === "rechazado"
  ) {
    return "/entrar/pendiente";
  }

  return "/entrar";
}

/** Exige ser staff; si no, redirige al login. Devuelve el perfil. */
export async function requireStaff(): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) redirect("/entrar");
  return profile;
}

/** Exige rol administrador. */
export async function requireAdmin(): Promise<Profile> {
  const profile = await requireStaff();
  if (profile.rol !== "admin") redirect("/admin");
  return profile;
}
