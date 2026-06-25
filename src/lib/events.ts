import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import type { EventRow } from "@/lib/supabase/types";

/**
 * Evento activo actual. En el MVP hay uno solo (el más reciente activo).
 * Cuando existan varios eventos simultáneos, esto se resolverá por slug en la URL.
 * `cache` evita repetir la consulta dentro del mismo render del servidor.
 */
export const getActiveEvent = cache(async (): Promise<EventRow | null> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select("*")
    .eq("activo", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ?? null;
});
