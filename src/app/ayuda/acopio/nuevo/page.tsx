import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { CollectionPointForm } from "@/components/help/collection-point-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("acopio");
  return { title: t("register") };
}

export default async function NewAcopioPage() {
  const t = await getTranslations("acopio");
  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <Link
        href="/ayuda/acopio"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {t("back")}
      </Link>
      <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
        {t("register")}
      </h1>
      <p className="mt-1 text-muted-foreground text-pretty">
        {t("registerIntro")}
      </p>
      <div className="mt-6">
        <CollectionPointForm />
      </div>
    </div>
  );
}
