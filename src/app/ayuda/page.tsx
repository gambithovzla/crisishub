import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { HelpCard } from "@/components/help/help-card";
import { getActiveEvent } from "@/lib/events";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import type { HelpMode } from "@/lib/supabase/types";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("help") };
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function HelpPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const t = await getTranslations("help");
  const sp = await searchParams;
  const modo: HelpMode = sp.modo === "ofrezco" ? "ofrezco" : "necesito";

  const event = await getActiveEvent();
  const supabase = await createClient();
  const { data } = event
    ? await supabase
        .from("help_requests")
        .select("*")
        .eq("event_id", event.id)
        .eq("modo", modo)
        .order("created_at", { ascending: false })
        .limit(60)
    : { data: [] };
  const list = data ?? [];

  const tabs: { modo: HelpMode; label: string }[] = [
    { modo: "necesito", label: t("tab.necesito") },
    { modo: "ofrezco", label: t("tab.ofrezco") },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        {t("title")}
      </h1>
      <p className="mt-1 text-muted-foreground">{t("intro")}</p>

      {/* Pestañas (enlaces, sin JS) */}
      <div
        role="tablist"
        className="mt-6 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1"
      >
        {tabs.map((tab) => {
          const activo = tab.modo === modo;
          return (
            <Link
              key={tab.modo}
              href={`/ayuda?modo=${tab.modo}`}
              role="tab"
              aria-selected={activo}
              className={cn(
                "rounded-md px-3 py-2 text-center text-sm font-medium transition-colors",
                activo
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      <div className="mt-4">
        <Button
          render={<Link href={`/ayuda/nueva?modo=${modo}`} />}
          size="lg"
          className="h-12 w-full text-base"
        >
          <Plus className="size-5" />
          {modo === "necesito" ? t("ctaNecesito") : t("ctaOfrezco")}
        </Button>
      </div>

      {list.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed p-10 text-center text-muted-foreground">
          {t("empty")}
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {list.map((item) => (
            <HelpCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
