import type { HelpCategory, HelpMode, HelpStatus } from "@/lib/supabase/types";

export const HELP_MODES: HelpMode[] = ["necesito", "ofrezco"];

export const HELP_CATEGORIES: HelpCategory[] = [
  "agua",
  "comida",
  "medicinas",
  "hospedaje",
  "transporte",
  "electricidad",
  "internet",
  "ropa",
  "otros",
];

export const HELP_STATUSES: HelpStatus[] = [
  "pendiente",
  "en_proceso",
  "resuelta",
];

/** Emoji por categoría (para tarjetas y selects). */
export const helpCategoryEmoji: Record<HelpCategory, string> = {
  agua: "💧",
  comida: "🍞",
  medicinas: "💊",
  hospedaje: "🏠",
  transporte: "🚗",
  electricidad: "⚡",
  internet: "📶",
  ropa: "👕",
  otros: "📦",
};

/** Clases de color por estado de la solicitud. */
export const helpStatusStyles: Record<HelpStatus, string> = {
  pendiente: "bg-warning/15 text-warning ring-warning/30",
  en_proceso: "bg-primary/15 text-primary ring-primary/30",
  resuelta: "bg-success/15 text-success ring-success/30",
};
