import { z } from "zod";

/**
 * Validación del formulario "Tengo información" (pista sobre una persona).
 * Solo la información es obligatoria. Todo se maneja como texto.
 */
export const tipSchema = z.object({
  informacion: z
    .string()
    .trim()
    .min(1, "Escribe la información que tienes")
    .max(2000),
  nombre: z.string().trim().max(80),
  telefono: z
    .string()
    .trim()
    .max(25)
    .refine(
      (v) => v === "" || /^[0-9+()\s-]{7,}$/.test(v),
      "Teléfono inválido",
    ),
  ubicacion_texto: z.string().trim().max(200),
  lat: z.string().trim(),
  lng: z.string().trim(),
  foto_url: z.string().trim(),
});

export type TipInput = z.infer<typeof tipSchema>;
