import Link from "next/link";
import { ArrowRight, LifeBuoy, MapPin, Search, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { mainNav, reportHref } from "@/config/nav";

const moduleMeta: Record<string, { icon: typeof Users; descKey: string }> = {
  missing: { icon: Users, descKey: "moduleMissingDesc" },
  search: { icon: Search, descKey: "moduleSearchDesc" },
  map: { icon: MapPin, descKey: "moduleMapDesc" },
  help: { icon: LifeBuoy, descKey: "moduleHelpDesc" },
};

export default async function HomePage() {
  const t = await getTranslations("home");
  const tNav = await getTranslations("nav");

  return (
    <div className="mx-auto max-w-5xl px-4">
      {/* Hero */}
      <section className="border-b py-10 sm:py-14">
        <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
          {t("heroTitle")}
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-muted-foreground text-pretty">
          {t("heroSubtitle")}
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button
            render={<Link href={reportHref} />}
            size="lg"
            className="h-14 text-base"
          >
            {t("ctaReport")}
            <ArrowRight className="size-5" />
          </Button>
          <Button
            render={<Link href="/buscar" />}
            size="lg"
            variant="outline"
            className="h-14 text-base"
          >
            {t("ctaSearch")}
          </Button>
        </div>
      </section>

      {/* Módulos */}
      <section className="py-10">
        <h2 className="mb-5 text-xl font-semibold">{t("modulesTitle")}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {mainNav.map((item) => {
            const meta = moduleMeta[item.key];
            const Icon = meta.icon;
            return (
              <Card
                key={item.href}
                className="transition-colors hover:border-primary"
              >
                <Link
                  href={item.href}
                  className="block rounded-xl focus-visible:outline-none"
                >
                  <CardContent className="flex items-start gap-4 p-5">
                    <span className="rounded-lg bg-accent p-3 text-accent-foreground">
                      <Icon className="size-6" />
                    </span>
                    <div>
                      <h3 className="text-lg font-semibold">{tNav(item.key)}</h3>
                      <p className="mt-1 text-muted-foreground">
                        {t(meta.descKey)}
                      </p>
                    </div>
                    <ArrowRight className="ml-auto size-5 self-center text-muted-foreground" />
                  </CardContent>
                </Link>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
