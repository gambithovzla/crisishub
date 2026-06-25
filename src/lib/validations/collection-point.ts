import { z } from "zod";

import { HELP_CATEGORIES } from "@/lib/help";
import type { HelpCategory } from "@/lib/supabase/types";

/** Validación del formulario "Registrar centro de acopio". */
export const collectionPointSchema = z.object({
  pais: z.string().trim().min(1, "Indica el país").max(60),
  ciudad: z.string().trim().max(80),
  nombre: z.string().trim().min(1, "Nombre del lugar").max(120),
  direccion: z.string().trim().max(200),
  lat: z.string().trim(),
  lng: z.string().trim(),
  categorias: z.array(
    z.enum(HELP_CATEGORIES as [HelpCategory, ...HelpCategory[]]),
  ),
  instrucciones: z.string().trim().max(1500),
  horario: z.string().trim().max(120),
  contacto: z.string().trim().max(120),
  url: z.string().trim().max(200),
});

export type CollectionPointInput = z.infer<typeof collectionPointSchema>;
