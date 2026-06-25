import { z } from "zod";

import { MARKER_TYPES } from "@/lib/markers";
import type { MarkerType } from "@/lib/supabase/types";

const isLat = (v: string) => {
  const n = Number(v);
  return v !== "" && Number.isFinite(n) && n >= -90 && n <= 90;
};
const isLng = (v: string) => {
  const n = Number(v);
  return v !== "" && Number.isFinite(n) && n >= -180 && n <= 180;
};

/** Validación del marcador del mapa. lat/lng llegan como texto desde el cliente. */
export const markerSchema = z.object({
  tipo: z.enum(MARKER_TYPES as [MarkerType, ...MarkerType[]]),
  descripcion: z.string().trim().max(500),
  usuario: z.string().trim().max(80),
  lat: z.string().refine(isLat, "Latitud inválida"),
  lng: z.string().refine(isLng, "Longitud inválida"),
  foto_url: z.string().trim(),
});

export type MarkerInput = z.infer<typeof markerSchema>;
