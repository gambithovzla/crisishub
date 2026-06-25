import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { CollectionPointCard } from "@/components/help/collection-point-card";
import { getActiveEvent } from "@/lib/events";
import { createClient } from "@/lib/supabase/server";
import type { CollectionPoint } from "@/lib/supabase/types";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("acopio");
  return { title: t("title") };
}

export default async function AcopioPage() {
  const t = await getTranslations("acopio");

  const event = await getActiveEvent();
  const supabase = await createClient();
  const { data } = event
    ? await supabase
        .from("collection_points")
        .select("*")
        .eq("event_id", event.id)
        .order("pais", { ascending: true })
        .order("ciudad", { ascending: true })
        .limit(300)
    : { data: [] };
  const points = data ?? [];

  // Agrupar por país
  const groups = new Map<string, CollectionPoint[]>();
  for (const p of points) {
    const arr = groups.get(p.pais) ?? [];
    arr.push(p);
    groups.set(p.pais, arr);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link
        href="/ayuda"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {t("back")}
      </Link>

      <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
        🌍 {t("title")}
      </h1>
      <p className="mt-1 text-muted-foreground text-pretty">{t("intro")}</p>

      <Button
        render={<Link href="/ayuda/acopio/nuevo" />}
        size="lg"
        className="mt-5 h-12 w-full text-base"
      >
        <Plus className="size-5" />
        {t("register")}
      </Button>

      {points.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed p-10 text-center text-muted-foreground">
          {t("empty")}
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          {[...groups.entries()].map(([pais, list]) => (
            <section key={pais}>
              <h2 className="mb-3 text-lg font-semibold">
                {pais}{" "}
                <span className="font-normal text-muted-foreground">
                  ({list.length})
                </span>
              </h2>
              <div className="space-y-3">
                {list.map((point) => (
                  <CollectionPointCard key={point.id} point={point} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
