import { z } from "zod";

import { DOCUMENT_TYPES, PATIENT_STATUSES } from "@/lib/health";
import type { DocumentType, PatientStatus } from "@/lib/supabase/types";

/** Validación del formulario "Registrar paciente/herido". */
export const patientRecordSchema = z
  .object({
    nombre: z.string().trim().min(2, "Nombre completo del paciente").max(160),
    facilityId: z.string().trim(),
    facilityNombre: z.string().trim().max(160),
    documentoTipo: z.enum(
      DOCUMENT_TYPES as [DocumentType, ...DocumentType[]],
    ),
    documento: z.string().trim().max(40),
    edad: z.string().trim(),
    sexo: z.string().trim().max(10),
    estado: z.enum(PATIENT_STATUSES as [PatientStatus, ...PatientStatus[]]),
    notas: z.string().trim().max(1000),
    reportanteNombre: z.string().trim().max(120),
    reportanteContacto: z.string().trim().max(120),
  })
  .refine(
    (v) =>
      Boolean(v.facilityId) ||
      v.facilityNombre.trim().length > 0,
    {
      message: "Indica el centro de salud",
      path: ["facilityNombre"],
    },
  )
  .refine(
    (v) => v.documentoTipo === "sin_documento" || v.documento.trim().length > 0,
    {
      message: "Indica el número de documento",
      path: ["documento"],
    },
  );

export type PatientRecordInput = z.infer<typeof patientRecordSchema>;
