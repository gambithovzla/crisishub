import type { MarkerType } from "@/lib/supabase/types";

export const MARKER_TYPES: MarkerType[] = [
  "hospital",
  "refugio",
  "acopio",
  "agua",
  "calle_bloqueada",
  "edificio_colapsado",
];

/** Emoji y color por tipo de marcador (para los pines del mapa). */
export const markerMeta: Record<MarkerType, { emoji: string; color: string }> = {
  hospital: { emoji: "🏥", color: "#dc2626" },
  refugio: { emoji: "⛺", color: "#2563eb" },
  acopio: { emoji: "📦", color: "#9333ea" },
  agua: { emoji: "💧", color: "#0891b2" },
  calle_bloqueada: { emoji: "🚧", color: "#d97706" },
  edificio_colapsado: { emoji: "🏚️", color: "#4b5563" },
};
