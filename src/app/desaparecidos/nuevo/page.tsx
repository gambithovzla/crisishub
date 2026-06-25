import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { MissingPersonForm } from "@/components/missing/missing-person-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("missing");
  return { title: t("newTitle") };
}

export default async function NewMissingPage() {
  const t = await getTranslations("missing");
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        {t("newTitle")}
      </h1>
      <p className="mt-2 text-muted-foreground text-pretty">{t("newIntro")}</p>
      <div className="mt-8">
        <MissingPersonForm />
      </div>
    </div>
  );
}
