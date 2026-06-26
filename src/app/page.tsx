import Link from "next/link";
import { ArrowRight, ArrowUpRight, Hospital, LifeBuoy, MapPin, Search, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { mainNav, reportHref } from "@/config/nav";
import { getActiveEvent } from "@/lib/events";

const moduleMeta: Record<string, { icon: typeof Users; descKey: string }> = {
  missing: { icon: Users, descKey: "moduleMissingDesc" },
  search: { icon: Search, descKey: "moduleSearchDesc" },
  map: { icon: MapPin, descKey: "moduleMapDesc" },
  health: { icon: Hospital, descKey: "moduleHealthDesc" },
  help: { icon: LifeBuoy, descKey: "moduleHelpDesc" },
};

export default async function HomePage() {
  const t = await getTranslations("home");
  const tNav = await getTranslations("nav");
  const event = await getActiveEvent();

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

      {/* Hero */}
      <section className="py-12 sm:py-16">
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
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              render={<Link href={reportHref} />}
              size="lg"
              className="h-13 px-6 text-base"
            >
              {t("ctaReport")}
              <ArrowRight className="size-5" />
            </Button>
            <Button
              render={<Link href="/buscar" />}
              size="lg"
              variant="outline"
              className="h-13 px-6 text-base"
            >
              {t("ctaSearch")}
            </Button>
          </div>
        </div>
      </section>

      {/* Servicios (directorio con separadores hairline) */}
      <section className="border-t py-12 sm:py-14">
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
