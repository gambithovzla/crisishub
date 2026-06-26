import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { PatientForm } from "@/components/health/patient-form";
import { getActiveEvent } from "@/lib/events";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("health");
  return { title: t("registerPatient") };
}

export default async function NewPatientPage() {
  const t = await getTranslations("health");

  const event = await getActiveEvent();
  const supabase = await createClient();
  const { data } = event
    ? await supabase
        .from("health_facilities")
        .select("id, nombre, estado")
        .eq("event_id", event.id)
        .eq("activo", true)
        .order("estado", { ascending: true })
        .order("nombre", { ascending: true })
        .limit(500)
    : { data: [] };
  const facilities = data ?? [];

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <Link
        href="/hospitales"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {t("back")}
      </Link>
      <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
        {t("registerPatient")}
      </h1>
      <p className="mt-1 text-muted-foreground text-pretty">
        {t("registerPatientIntro")}
      </p>
      <div className="mt-6">
        <PatientForm facilities={facilities} />
      </div>
    </div>
  );
}
