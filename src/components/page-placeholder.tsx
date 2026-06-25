import { Construction } from "lucide-react";
import { getTranslations } from "next-intl/server";

export async function PagePlaceholder({ title }: { title: string }) {
  const t = await getTranslations("common");
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
      <div className="mt-6 flex items-center gap-3 rounded-lg border border-dashed bg-muted/30 p-6 text-muted-foreground">
        <Construction className="size-6 shrink-0 text-warning" />
        <div>
          <p className="font-medium text-foreground">{t("comingSoon")}</p>
          <p className="mt-0.5 text-sm">{t("comingSoonNote")}</p>
        </div>
      </div>
    </div>
  );
}
