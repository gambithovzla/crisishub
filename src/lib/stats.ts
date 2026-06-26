import { cache } from "react";

import { getActiveEvent } from "@/lib/events";
import { createClient } from "@/lib/supabase/server";

export type Stats = {
  reported: number;
  found: number;
  helpResolved: number;
  volunteers: number;
};

/**
 * Conteos reales del evento activo para el contador de la home.
 * Solo cuenta lo visible (RLS ya lo restringe). Los voluntarios se obtienen
 * de la función pública `listar_voluntarios` (la tabla es solo-staff).
 */
export const getStats = cache(async (): Promise<Stats> => {
  const empty: Stats = { reported: 0, found: 0, helpResolved: 0, volunteers: 0 };
  const event = await getActiveEvent();
  if (!event) return empty;

  const supabase = await createClient();

  const [reported, found, helpResolved, vols] = await Promise.all([
    supabase
      .from("missing_persons")
      .select("id", { count: "exact", head: true })
      .eq("event_id", event.id)
      .eq("moderation", "visible"),
    supabase
      .from("missing_persons")
      .select("id", { count: "exact", head: true })
      .eq("event_id", event.id)
      .eq("moderation", "visible")
      .eq("estado", "encontrado_vivo"),
    supabase
      .from("help_requests")
      .select("id", { count: "exact", head: true })
      .eq("event_id", event.id)
      .eq("moderation", "visible")
      .eq("estado", "resuelta"),
    supabase.rpc("listar_voluntarios", { prof: "" }),
  ]);

  return {
    reported: reported.count ?? 0,
    found: found.count ?? 0,
    helpResolved: helpResolved.count ?? 0,
    volunteers: Array.isArray(vols.data) ? vols.data.length : 0,
  };
});
