import type { Profession } from "@/lib/supabase/types";

// Psicólogos primero (los más necesitados), luego el resto.
export const PROFESSIONS: Profession[] = [
  "psicologo",
  "psiquiatra",
  "medico_general",
  "pediatra",
  "enfermeria",
  "trabajo_social",
  "nutricion",
  "fisioterapia",
  "odontologia",
  "otro",
];

export const MODALIDADES = [
  "online",
  "telefono",
  "presencial",
  "whatsapp",
] as const;
export type Modalidad = (typeof MODALIDADES)[number];

export const professionEmoji: Record<Profession, string> = {
  psicologo: "🧠",
  psiquiatra: "🧠",
  medico_general: "🩺",
  pediatra: "👶",
  enfermeria: "💉",
  trabajo_social: "🤝",
  nutricion: "🥗",
  fisioterapia: "🦴",
  odontologia: "🦷",
  otro: "⚕️",
};
