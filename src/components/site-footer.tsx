import { getTranslations } from "next-intl/server";

export async function SiteFooter() {
  const t = await getTranslations("footer");
  const tApp = await getTranslations("app");

  return (
    <footer className="mt-auto border-t bg-muted/30">
      <div className="mx-auto max-w-5xl px-4 py-8 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">{tApp("name")}</p>
        <p className="mt-1">{t("rights")}</p>
        <p className="mt-1">{t("notSocialNetwork")}</p>
      </div>
    </footer>
  );
}
