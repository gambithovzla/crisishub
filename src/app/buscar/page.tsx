import type { Metadata } from "next";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PersonCard } from "@/components/missing/person-card";
import { getActiveEvent } from "@/lib/events";
import { createClient } from "@/lib/supabase/server";
import type { PersonStatus } from "@/lib/supabase/types";
import { ESTADOS_VENEZUELA } from "@/lib/venezuela";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("search") };
}

const PERSON_STATUSES: PersonStatus[] = [
  "desaparecido",
  "encontrado_vivo",
  "fallecido",
];

const selectClass =
  "flex h-11 w-full rounded-lg border border-input bg-background px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const str = (v: string | string[] | undefined) =>
  typeof v === "string" ? v.trim() : "";

// Quita acentos para que la búsqueda coincida con search_vector (sin acentos).
const DIACRITICS = /[̀-ͯ]/g;
const stripAccents = (s: string) => s.normalize("NFD").replace(DIACRITICS, "");

export default async function SearchPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const t = await getTranslations("search");
  const tm = await getTranslations("missing");

  const sp = await searchParams;
  const q = str(sp.q);
  const estado = str(sp.estado);
  const statusRaw = str(sp.status);
  const status = PERSON_STATUSES.includes(statusRaw as PersonStatus)
    ? (statusRaw as PersonStatus)
    : "";
  const edadStr = str(sp.edad);
  const edad = /^\d{1,3}$/.test(edadStr) ? Number(edadStr) : null;

  const hasFilters = Boolean(q || estado || status || edad != null);

  const event = await getActiveEvent();
  const supabase = await createClient();

  let query = supabase.from("missing_persons").select("*").limit(40);
  if (event) query = query.eq("event_id", event.id);
  if (q)
    query = query.textSearch("search_vector", stripAccents(q), {
      type: "websearch",
      config: "spanish",
    });
  if (estado) query = query.eq("estado_region", estado);
  if (status) query = query.eq("estado", status);
  if (edad != null)
    query = query.gte("edad_aprox", edad - 5).lte("edad_aprox", edad + 5);
  query = query.order("created_at", { ascending: false });

  const { data } = await query;
  const results = data ?? [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        {t("title")}
      </h1>
      <p className="mt-1 text-muted-foreground">{t("intro")}</p>

      {/* Formulario nativo (funciona sin JavaScript, ideal para 2G) */}
      <form
        action="/buscar"
        method="get"
        className="mt-6 space-y-4 rounded-xl border bg-card p-4 sm:p-5"
      >
        <div className="space-y-1.5">
          <Label htmlFor="q">{t("q")}</Label>
          <Input
            id="q"
            name="q"
            type="search"
            defaultValue={q}
            placeholder={t("qPlaceholder")}
            className="h-11 text-base"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="estado">{tm("label.estado")}</Label>
            <select
              id="estado"
              name="estado"
              defaultValue={estado}
              className={selectClass}
            >
              <option value="">{t("allEstados")}</option>
              {ESTADOS_VENEZUELA.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="status">{t("situation")}</Label>
            <select
              id="status"
              name="status"
              defaultValue={status}
              className={selectClass}
            >
              <option value="">{t("allStatus")}</option>
              {PERSON_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {tm(`status.${s}`)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edad">{t("edad")}</Label>
            <Input
              id="edad"
              name="edad"
              inputMode="numeric"
              defaultValue={edadStr}
              placeholder="Ej.: 25"
              className="h-11 text-base"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button type="submit" className="h-11 flex-1 text-base">
            <Search className="size-4" />
            {t("submit")}
          </Button>
          {hasFilters ? (
            <Button
              type="button"
              variant="outline"
              className="h-11"
              render={<Link href="/buscar" />}
            >
              <X className="size-4" />
              {t("clear")}
            </Button>
          ) : null}
        </div>
      </form>

      {/* Resultados */}
      <div className="mt-6">
        <p className="mb-3 text-sm text-muted-foreground">
          {t("resultsCount", { count: results.length })}
        </p>

        {results.length === 0 ? (
          <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
            {hasFilters ? t("empty") : t("emptyAll")}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {results.map((person) => (
              <PersonCard key={person.id} person={person} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
