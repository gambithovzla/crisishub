import { z } from "zod";

import { FACILITY_TYPES } from "@/lib/health";
import type { FacilityType } from "@/lib/supabase/types";

/** Validación del formulario "Registrar centro de salud". */
export const healthFacilitySchema = z.object({
  nombre: z.string().trim().min(1, "Nombre del centro").max(160),
  tipo: z.enum(FACILITY_TYPES as [FacilityType, ...FacilityType[]]),
  estado: z.string().trim().max(60),
  ciudad: z.string().trim().max(80),
  direccion: z.string().trim().max(200),
  lat: z.string().trim(),
  lng: z.string().trim(),
  telefono: z.string().trim().max(60),
  capacidad: z.string().trim().max(500),
  url: z.string().trim().max(200),
});

export type HealthFacilityInput = z.infer<typeof healthFacilitySchema>;
