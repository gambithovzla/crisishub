import type { Metadata } from "next";
import Link from "next/link";
import { HeartHandshake, UserPlus } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { VolunteerCard } from "@/components/professionals/volunteer-card";
import { PROFESSIONS, professionEmoji } from "@/lib/professions";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import type { Profession, VolunteerPublic } from "@/lib/supabase/types";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("professionals");
  return { title: t("title") };
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ProfesionalesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const t = await getTranslations("professionals");
  const sp = await searchParams;
  const profRaw = typeof sp.prof === "string" ? sp.prof : "";
  const prof = (PROFESSIONS as string[]).includes(profRaw) ? profRaw : "";

  const supabase = await createClient();
  const { data } = await supabase.rpc("listar_voluntarios", { prof });
  const list = (data ?? []) as VolunteerPublic[];

  // Agrupar por profesión (la RPC ya ordena con psicólogos primero).
  const groups = new Map<Profession, VolunteerPublic[]>();
  for (const v of list) {
    const arr = groups.get(v.profesion) ?? [];
    arr.push(v);
    groups.set(v.profesion, arr);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
        <HeartHandshake className="size-7 text-primary" aria-hidden />
        {t("title")}
      </h1>
      <p className="mt-1 text-muted-foreground text-pretty">{t("intro")}</p>

      <Button
        render={<Link href="/profesionales/nuevo" />}
        size="lg"
        className="mt-5 h-12 w-full text-base"
      >
        <UserPlus className="size-5" />
        {t("registerCta")}
      </Button>

      {/* Filtros por profesión */}
      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          href="/profesionales"
          className={cn(
            "rounded-full border px-3 py-1.5 text-sm",
            prof === ""
              ? "border-primary bg-primary/10"
              : "text-muted-foreground",
          )}
        >
          {t("all")}
        </Link>
        {PROFESSIONS.map((p) => (
          <Link
            key={p}
            href={`/profesionales?prof=${p}`}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm",
              prof === p
                ? "border-primary bg-primary/10"
                : "text-muted-foreground",
            )}
          >
            <span aria-hidden>{professionEmoji[p]}</span>
            {t(`profession.${p}`)}
          </Link>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed p-10 text-center text-muted-foreground">
          {t("empty")}
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          {[...groups.entries()].map(([p, vols]) => (
            <section key={p}>
              <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                <span aria-hidden>{professionEmoji[p]}</span>
                {t(`profession.${p}`)}{" "}
                <span className="font-normal text-muted-foreground">
                  ({vols.length})
                </span>
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {vols.map((v) => (
                  <VolunteerCard key={v.id} v={v} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
