import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { HelpForm } from "@/components/help/help-form";
import type { HelpMode } from "@/lib/supabase/types";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("help");
  return { title: t("title") };
}

export default async function NewHelpPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const t = await getTranslations("help");
  const sp = await searchParams;
  const modo: HelpMode = sp.modo === "ofrezco" ? "ofrezco" : "necesito";

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <Link
        href={`/ayuda?modo=${modo}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {t("back")}
      </Link>
      <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
        {modo === "necesito" ? t("ctaNecesito") : t("ctaOfrezco")}
      </h1>
      <p className="mt-1 text-muted-foreground">
        {modo === "necesito" ? t("introNecesito") : t("introOfrezco")}
      </p>
      <div className="mt-6">
        <HelpForm modo={modo} />
      </div>
    </div>
  );
}
