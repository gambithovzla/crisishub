import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "./types";

/**
 * Cliente de Supabase para el NAVEGADOR (componentes "use client").
 * Usa la clave pública anon; el acceso queda protegido por RLS.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
