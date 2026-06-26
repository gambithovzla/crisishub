import type {
  DocumentType,
  FacilityType,
  PatientStatus,
} from "@/lib/supabase/types";

export const FACILITY_TYPES: FacilityType[] = [
  "hospital",
  "clinica",
  "ambulatorio",
  "cdi",
  "modulo",
  "cruz_roja",
  "otro",
];

export const PATIENT_STATUSES: PatientStatus[] = [
  "ingresado",
  "en_observacion",
  "estable",
  "grave",
  "alta",
  "fallecido",
  "no_identificado",
];

export const DOCUMENT_TYPES: DocumentType[] = [
  "cedula_v",
  "cedula_e",
  "pasaporte",
  "otro",
  "sin_documento",
];

/** Emoji por tipo de centro (para tarjetas). */
export const facilityTypeEmoji: Record<FacilityType, string> = {
  hospital: "🏥",
  clinica: "🏨",
  ambulatorio: "🩺",
  cdi: "➕",
  modulo: "⛑️",
  cruz_roja: "🚑",
  otro: "🏥",
};

/** Clases de color por estado del paciente (anillo + texto). */
export const patientStatusStyles: Record<PatientStatus, string> = {
  ingresado: "bg-primary/15 text-primary ring-primary/30",
  en_observacion: "bg-primary/15 text-primary ring-primary/30",
  estable: "bg-success/15 text-success ring-success/30",
  grave: "bg-warning/15 text-warning ring-warning/30",
  alta: "bg-success/15 text-success ring-success/30",
  fallecido: "bg-destructive/15 text-destructive ring-destructive/30",
  no_identificado: "bg-muted text-muted-foreground ring-border",
};

/** Prefijo legible del documento para mostrar (V-, E-, Pasaporte…). */
export const documentPrefix: Record<DocumentType, string> = {
  cedula_v: "V-",
  cedula_e: "E-",
  pasaporte: "",
  otro: "",
  sin_documento: "",
};
