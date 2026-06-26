import { z } from "zod";

import { MODALIDADES, PROFESSIONS } from "@/lib/professions";
import type { Profession } from "@/lib/supabase/types";

/** Validación del registro de profesional voluntario. */
export const volunteerSchema = z.object({
  nombre: z.string().trim().min(1, "Escribe tu nombre").max(100),
  profesion: z.enum(PROFESSIONS as [Profession, ...Profession[]]),
  especialidad: z.string().trim().max(120),
  modalidades: z.array(z.enum(MODALIDADES)),
  zona: z.string().trim().max(120),
  idiomas: z.string().trim().max(120),
  bio: z.string().trim().max(1000),
  contacto: z.string().trim().min(3, "Deja un contacto").max(120),
  colegio_numero: z.string().trim().max(60),
  // Ruta de la credencial subida al bucket privado (la sube el formulario).
  credencial_path: z.string().trim(),
});

export type VolunteerInput = z.infer<typeof volunteerSchema>;
