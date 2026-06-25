import { cache } from "react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/supabase/types";

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

/** Exige ser staff; si no, redirige al login. Devuelve el perfil. */
export async function requireStaff(): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) redirect("/entrar");
  return profile;
}
