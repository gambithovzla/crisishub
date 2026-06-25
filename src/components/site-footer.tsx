import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { Logo } from "@/components/logo";
import { mainNav } from "@/config/nav";

export async function SiteFooter() {
  const t = await getTranslations("footer");
  const tApp = await getTranslations("app");
  const tNav = await getTranslations("nav");

  return (
    <footer className="mt-auto border-t bg-muted/20">
      <div className="flag-stripe h-0.5 w-full" aria-hidden />
      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr]">
          {/* Marca */}
          <div className="max-w-xs">
            <p className="flex items-center gap-2 font-semibold tracking-tight text-foreground">
              <Logo className="size-6" />
              {tApp("name")}
              <span className="text-xs font-medium text-muted-foreground">VE</span>
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {t("tagline")}
            </p>
          </div>

          {/* Herramientas */}
          <nav aria-label={t("sectionTools")}>
            <p className="eyebrow">{t("sectionTools")}</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {mainNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
                  >
                    {tNav(item.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Acerca de */}
          <nav aria-label={t("sectionAbout")}>
            <p className="eyebrow">{t("sectionAbout")}</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link
                  href="/entrar"
                  className="text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
                >
                  {t("staffAccess")}
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        {/* Barra inferior */}
        <div className="mt-10 flex flex-col gap-1 border-t pt-6 text-xs text-muted-foreground">
          <p>{t("rights")}</p>
          <p>{t("notSocialNetwork")}</p>
        </div>
      </div>
    </footer>
  );
}
