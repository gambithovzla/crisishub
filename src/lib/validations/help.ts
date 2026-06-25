import { z } from "zod";

import { HELP_CATEGORIES, HELP_MODES } from "@/lib/help";
import type { HelpCategory, HelpMode } from "@/lib/supabase/types";

/** Validación del formulario de Ayuda (necesito / ofrezco). */
export const helpRequestSchema = z.object({
  modo: z.enum(HELP_MODES as [HelpMode, ...HelpMode[]]),
  categoria: z.enum(HELP_CATEGORIES as [HelpCategory, ...HelpCategory[]]),
  descripcion: z
    .string()
    .trim()
    .min(1, "Describe lo que necesitas u ofreces")
    .max(1000),
  ubicacion_texto: z.string().trim().max(200),
  lat: z.string().trim(),
  lng: z.string().trim(),
  contacto: z
    .string()
    .trim()
    .min(3, "Deja un teléfono o forma de contacto")
    .max(120),
});

export type HelpRequestInput = z.infer<typeof helpRequestSchema>;
