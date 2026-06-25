import { z } from "zod";

export const CONTACT_METHODS = [
  "llamada",
  "whatsapp",
  "sms",
  "presencial",
  "redes",
  "otro",
] as const;

/**
 * Validación del formulario "Reportar persona desaparecida".
 * Todos los campos se manejan como texto (lo que devuelven los inputs);
 * los vacíos van como "" y la conversión a número/fecha se hace en el server action.
 */
export const missingPersonSchema = z.object({
  nombre: z.string().trim().min(1, "Escribe el nombre").max(80),
  apellido: z.string().trim().min(1, "Escribe el apellido").max(80),

  edad_aprox: z
    .string()
    .trim()
    .refine(
      (v) => v === "" || (/^\d{1,3}$/.test(v) && Number(v) <= 129),
      "Edad entre 0 y 129",
    ),

  ciudad: z.string().trim().max(80),
  estado_region: z.string().trim().max(80),
  descripcion: z.string().trim().max(2000),

  // Familiar que reporta (obligatorio)
  familiar_nombre: z.string().trim().min(1, "Escribe tu nombre").max(80),
  familiar_telefono: z
    .string()
    .trim()
    .min(7, "Teléfono demasiado corto")
    .max(25, "Teléfono demasiado largo")
    .regex(/^[0-9+()\s-]+$/, "Solo números y los signos + - ( )"),

  // Bloque "Último contacto" (opcional: se permite "")
  ultima_ubicacion_texto: z.string().trim().max(200),
  ultima_lat: z.string().trim(),
  ultima_lng: z.string().trim(),
  ultimo_contacto_at: z.string().trim(),
  ultimo_contacto_medio: z.enum(CONTACT_METHODS).or(z.literal("")),
  ultimo_contacto_actividad: z.string().trim().max(500),

  // URL de la foto (ya subida a Storage antes de enviar)
  foto_url: z.string().trim(),
});

export type MissingPersonInput = z.infer<typeof missingPersonSchema>;
