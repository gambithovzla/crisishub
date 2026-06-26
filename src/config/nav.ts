import type { LucideIcon } from "lucide-react";
import {
  HeartHandshake,
  Hospital,
  LifeBuoy,
  MapPin,
  Search,
  Users,
} from "lucide-react";

export type NavItem = {
  /** Clave dentro del namespace de traducción "nav". */
  key: "missing" | "search" | "map" | "help" | "health" | "professionals";
  href: string;
  icon: LucideIcon;
};

/** Navegación principal del MVP (los módulos viven aquí). */
export const mainNav: NavItem[] = [
  { key: "missing", href: "/desaparecidos", icon: Users },
  { key: "search", href: "/buscar", icon: Search },
  { key: "map", href: "/mapa", icon: MapPin },
  { key: "health", href: "/hospitales", icon: Hospital },
  { key: "professionals", href: "/profesionales", icon: HeartHandshake },
  { key: "help", href: "/ayuda", icon: LifeBuoy },
];

/** Acción primaria, presente en toda la app. */
export const reportHref = "/desaparecidos/nuevo";
