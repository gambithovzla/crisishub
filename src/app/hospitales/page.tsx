import type { Metadata } from "next";
import Link from "next/link";
import { Hospital, Search, ShieldAlert, UserPlus, X } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FacilityCard } from "@/components/health/facility-card";
import { PatientCard } from "@/components/health/patient-card";
import { getActiveEvent } from "@/lib/events";
import { createClient } from "@/lib/supabase/server";
import type { HealthFacility } from "@/lib/supabase/types";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("health");
  return { title: t("title") };
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const str = (v: string | string[] | undefined) =>
  typeof v === "string" ? v.trim() : "";

export default async function HospitalesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const t = await getTranslations("health");

  const sp = await searchParams;
  const q = str(sp.q);

  const event = await getActiveEvent();
  const supabase = await createClient();

  // Directorio de centros (lectura pública de lo visible).
  const { data: facData } = event
    ? await supabase
        .from("health_facilities")
        .select("*")
        .eq("event_id", event.id)
        .eq("activo", true)
        .order("estado", { ascending: true })
        .order("nombre", { ascending: true })
        .limit(500)
    : { data: [] };
  const facilities = (facData ?? []) as HealthFacility[];

  // Búsqueda pública de pacientes (vía función segura que enmascara el documento).
  const { data: patients } = q
    ? await supabase.rpc("buscar_pacientes", { q })
    : { data: null };

  const groups = new Map<string, HealthFacility[]>();
  for (const f of facilities) {
    const key = f.estado ?? t("noEstado");
    const arr = groups.get(key) ?? [];
    arr.push(f);
    groups.set(key, arr);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        🏥 {t("title")}
      </h1>
      <p className="mt-1 text-muted-foreground text-pretty">{t("intro")}</p>

      {/* Búsqueda de pacientes (nativa, 2G-friendly) */}
      <section className="mt-6 rounded-xl border bg-card p-4 sm:p-5">
        <h2 className="text-lg font-semibold">{t("searchTitle")}</h2>
        <p className="mt-1 text-sm text-muted-foreground text-pretty">
          {t("searchIntro")}
        </p>
        <form action="/hospitales" method="get" className="mt-4 flex gap-2">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="q" className="sr-only">
              {t("searchLabel")}
            </Label>
            <Input
              id="q"
              name="q"
              type="search"
              defaultValue={q}
              placeholder={t("searchPlaceholder")}
              className="h-11 text-base"
            />
          </div>
          <Button type="submit" className="h-11">
            <Search className="size-4" />
            {t("searchSubmit")}
          </Button>
          {q ? (
            <Button
              type="button"
              variant="outline"
              className="h-11"
              render={<Link href="/hospitales" />}
            >
              <X className="size-4" />
            </Button>
          ) : null}
        </form>

        {q ? (
          <div className="mt-5">
            <p className="mb-3 text-sm text-muted-foreground">
              {t("resultsCount", { count: patients?.length ?? 0 })}
            </p>
            {patients && patients.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {patients.map((p) => (
                  <PatientCard key={p.id} patient={p} />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
                {t("searchEmpty")}
              </div>
            )}
          </div>
        ) : null}
      </section>

      {/* Acciones */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Button
          render={<Link href="/hospitales/paciente" />}
          size="lg"
          className="h-12 text-base"
        >
          <UserPlus className="size-5" />
          {t("registerPatient")}
        </Button>
        <Button
          render={<Link href="/hospitales/nuevo" />}
          size="lg"
          variant="outline"
          className="h-12 text-base"
        >
          <Hospital className="size-5" />
          {t("registerFacility")}
        </Button>
      </div>

      {/* Aviso de privacidad */}
      <div className="mt-4 flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/5 p-3 text-sm text-pretty">
        <ShieldAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
        <p className="text-muted-foreground">{t("privacyNote")}</p>
      </div>

      {/* Directorio de centros */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold tracking-tight">
          {t("directoryTitle")}
        </h2>
        {facilities.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed p-10 text-center text-muted-foreground">
            {t("directoryEmpty")}
          </div>
        ) : (
          <div className="mt-5 space-y-8">
            {[...groups.entries()].map(([estado, list]) => (
              <div key={estado}>
                <h3 className="mb-3 text-base font-semibold text-muted-foreground">
                  {estado}{" "}
                  <span className="font-normal">({list.length})</span>
                </h3>
                <div className="space-y-3">
                  {list.map((f) => (
                    <FacilityCard key={f.id} facility={f} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
