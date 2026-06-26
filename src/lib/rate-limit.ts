import "server-only";

import { headers } from "next/headers";

import { createClient } from "@/lib/supabase/server";

/**
 * Rate limiting por IP. Devuelve true si la acción está permitida.
 * Falla "abierto" (permite) si algo del limitador falla: nunca bloqueamos
 * a una persona en emergencia por un error técnico del anti-spam.
 */
export async function checkRateLimit(
  action: string,
  max = 6,
  windowSeconds = 60,
): Promise<boolean> {
  try {
    const h = await headers();
    const ip =
      (h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? "")
        .split(",")[0]
        .trim() || "unknown";

    const supabase = await createClient();
    const { data, error } = await supabase.rpc("check_rate_limit", {
      p_bucket: `${action}:${ip}`,
      p_max: max,
      p_window_seconds: windowSeconds,
    });
    if (error) return true;
    return data === true;
  } catch {
    return true;
  }
}

export const RATE_LIMIT_MESSAGE =
  "Has enviado demasiadas veces en poco tiempo. Espera un momento e inténtalo de nuevo.";
