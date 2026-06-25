import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./types";

/**
 * Cliente ADMINISTRADOR con la clave service_role. SALTA RLS por completo.
 * Úsalo SOLO en el servidor y para operaciones de confianza (moderación,
 * tareas internas). NUNCA lo importes en código de cliente.
 */
export function createAdminClient() {
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRole) {
    throw new Error(
      "Falta SUPABASE_SERVICE_ROLE_KEY en .env.local (clave secreta de servicio).",
    );
  }

  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRole,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
