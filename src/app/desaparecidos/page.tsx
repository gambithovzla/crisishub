import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { PersonCard } from "@/components/missing/person-card";
import { reportHref } from "@/config/nav";
import { getActiveEvent } from "@/lib/events";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("missing") };
}

export default async function MissingListPage() {
  const t = await getTranslations("missing");
  const tNav = await getTranslations("nav");

  const event = await getActiveEvent();
  const supabase = await createClient();
  const { data } = event
    ? await supabase
        .from("missing_persons")
        .select("*")
        .eq("event_id", event.id)
        .order("created_at", { ascending: false })
        .limit(60)
    : { data: [] };
  const list = data ?? [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {tNav("missing")}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {t("listCount", { count: list.length })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button render={<Link href="/buscar" />} variant="outline">
            <Search className="size-4" />
            {tNav("search")}
          </Button>
          <Button render={<Link href={reportHref} />}>
            <Plus className="size-4" />
            {tNav("report")}
          </Button>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed p-10 text-center">
          <p className="text-muted-foreground">{t("emptyList")}</p>
          <Button render={<Link href={reportHref} />} className="mt-4">
            {tNav("report")}
          </Button>
        </div>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {list.map((person) => (
            <PersonCard key={person.id} person={person} />
          ))}
        </div>
      )}
    </div>
  );
}
