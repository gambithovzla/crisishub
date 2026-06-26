import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Globe,
  HeartHandshake,
  Hospital,
  LifeBuoy,
  MapPin,
  Search,
  UserPlus,
  Users,
} from "lucide-react";
import { getTranslations } from "next-intl/server";

import { StatsBar } from "@/components/home/stats-bar";
import { mainNav, reportHref } from "@/config/nav";
import { getActiveEvent } from "@/lib/events";

const moduleMeta: Record<string, { icon: typeof Users; descKey: string }> = {
  missing: { icon: Users, descKey: "moduleMissingDesc" },
  search: { icon: Search, descKey: "moduleSearchDesc" },
  map: { icon: MapPin, descKey: "moduleMapDesc" },
  health: { icon: Hospital, descKey: "moduleHealthDesc" },
  professionals: {
    icon: HeartHandshake,
    descKey: "moduleProfessionalsDesc",
  },
  acopio: { icon: Globe, descKey: "moduleAcopioDesc" },
  help: { icon: LifeBuoy, descKey: "moduleHelpDesc" },
};

export default async function HomePage() {
  const t = await getTranslations("home");
  const tNav = await getTranslations("nav");
  const event = await getActiveEvent();

  // Tres acciones gigantes: lo único que importa en los primeros 5 segundos.
  const actions = [
    {
      href: reportHref,
      icon: UserPlus,
      label: t("ctaReport"),
      sub: t("actionReportSub"),
      primary: true,
    },
    {
      href: "/buscar",
      icon: Search,
      label: t("ctaSearch"),
      sub: t("actionSearchSub"),
      primary: false,
    },
    {
      href: "/ayuda",
      icon: HeartHandshake,
      label: t("ctaHelp"),
      sub: t("actionHelpSub"),
      primary: false,
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4">
      {/* Estado de emergencia activo */}
      {event ? (
        <Link
          href="/mapa"
          className="group mt-6 flex items-center gap-3 rounded-lg border border-emergency/25 bg-emergency/5 px-4 py-2.5 text-sm transition-colors hover:border-emergency/50"
        >
          <span className="live-dot shrink-0" aria-hidden />
          <span className="font-semibold uppercase tracking-wide text-emergency">
            {t("statusActive")}
          </span>
          <span className="min-w-0 flex-1 truncate text-foreground">
            {event.nombre}
            <span className="text-muted-foreground"> · {event.pais}</span>
          </span>
          <span className="hidden items-center gap-1 text-muted-foreground group-hover:text-foreground sm:inline-flex">
            {t("statusViewMap")}
            <ArrowUpRight className="size-4" />
          </span>
        </Link>
      ) : null}

      {/* Hero corto */}
      <section className="pt-10 pb-2 sm:pt-14">
        <div className="border-l-2 border-foreground/10 pl-5 sm:pl-7">
          <p className="eyebrow">
            <span className="flag-stripe h-3.5 w-5 rounded-[3px]" aria-hidden />
            {t("eyebrow")}
          </p>
          <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-[1.05] tracking-tight text-balance sm:text-5xl lg:text-6xl">
            {t("heroTitle")}
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground text-pretty">
            {t("heroSubtitle")}
          </p>
        </div>
      </section>

      {/* Tres acciones gigantes */}
      <section className="mt-8">
        <div className="grid gap-3 sm:grid-cols-3">
          {actions.map((a) => {
            const Icon = a.icon;
            return (
              <Link
                key={a.href}
                href={a.href}
                className={`group flex min-h-32 flex-col justify-between gap-4 rounded-2xl border p-6 transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring ${
                  a.primary
                    ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-card hover:border-primary"
                }`}
              >
                <Icon className="size-8 shrink-0" aria-hidden />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-lg font-semibold leading-tight text-balance">
                      {a.label}
                    </span>
                    <ArrowRight className="size-5 shrink-0 transition-transform group-hover:translate-x-0.5" />
                  </div>
                  <p
                    className={`mt-1 text-sm text-pretty ${
                      a.primary
                        ? "text-primary-foreground/80"
                        : "text-muted-foreground"
                    }`}
                  >
                    {a.sub}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Contador de confianza (oculto si todavía no hay datos) */}
      <StatsBar />

      {/* Vista previa del mapa (enlace ligero, sin cargar Leaflet en 2G) */}
      <section className="mt-4">
        <Link
          href="/mapa"
          className="group flex items-center gap-4 rounded-2xl border bg-card p-6 transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
        >
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl border text-foreground transition-colors group-hover:border-primary group-hover:text-primary">
            <MapPin className="size-6" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold tracking-tight">
              {t("mapPreviewTitle")}
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground text-pretty">
              {t("mapPreviewSub")}
            </p>
          </div>
          <span className="hidden items-center gap-1 text-sm text-muted-foreground group-hover:text-foreground sm:inline-flex">
            {t("mapPreviewCta")}
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>
      </section>

      {/* Servicios (directorio con separadores hairline) */}
      <section className="mt-12 border-t py-12 sm:py-14">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">{t("servicesLabel")}</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              {t("modulesTitle")}
            </h2>
          </div>
          <p className="hidden max-w-xs text-sm text-muted-foreground sm:block">
            {t("modulesIntro")}
          </p>
        </div>

        <ul className="mt-7 grid gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-2">
          {mainNav.map((item, i) => {
            const meta = moduleMeta[item.key];
            const Icon = meta.icon;
            return (
              <li key={item.href} className="bg-background">
                <Link
                  href={item.href}
                  className="group flex h-full items-center gap-4 p-5 transition-colors hover:bg-muted/40 focus-visible:bg-muted/40"
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-lg border text-foreground transition-colors group-hover:border-primary group-hover:text-primary">
                    <Icon className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground tabular-nums">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <h3 className="font-semibold tracking-tight">
                        {tNav(item.key)}
                      </h3>
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground text-pretty">
                      {t(meta.descKey)}
                    </p>
                  </div>
                  <ArrowRight className="size-5 shrink-0 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-foreground" />
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
