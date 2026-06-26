import { IdCard, Phone, User } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { ModBadge } from "@/components/admin/mod-badge";
import { ModerationActions } from "@/components/admin/moderation-actions";
import { PatientStatusBadge } from "@/components/health/patient-status-badge";
import { documentPrefix } from "@/lib/health";
import { createClient } from "@/lib/supabase/server";

export default async function AdminPacientesPage() {
  const t = await getTranslations("admin");
  const th = await getTranslations("health");
  const supabase = await createClient();

  // El staff sí puede leer la tabla directamente (RLS). Traemos el centro por relación manual.
  const { data } = await supabase
    .from("patient_records")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(300);
  const list = data ?? [];

  // Mapa de nombres de centros para mostrar.
  const facilityIds = [
    ...new Set(list.map((p) => p.facility_id).filter((x): x is number => x != null)),
  ];
  const facNames = new Map<number, string>();
  if (facilityIds.length > 0) {
    const { data: facs } = await supabase
      .from("health_facilities")
      .select("id, nombre")
      .in("id", facilityIds);
    for (const f of facs ?? []) facNames.set(f.id, f.nombre);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">
        {t("section.patients")}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">{t("listAll")}</p>

      <div className="mt-6 space-y-3">
        {list.map((p) => {
          const centro =
            (p.facility_id != null ? facNames.get(p.facility_id) : null) ??
            p.facility_nombre ??
            "—";
          const doc =
            p.documento_tipo !== "sin_documento" && p.documento
              ? `${documentPrefix[p.documento_tipo]}${p.documento}`
              : th(`docType.sin_documento`);
          return (
            <div key={p.id} className="rounded-xl border bg-card p-4">
              <div className="flex flex-wrap items-center gap-2">
                <User className="size-4 text-muted-foreground" aria-hidden />
                <span className="font-semibold">
                  #{p.id} {p.nombre}
                </span>
                <PatientStatusBadge estado={p.estado} />
                <ModBadge
                  moderation={p.moderation}
                  label={t(`moderation.${p.moderation}`)}
                />
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span>{centro}</span>
                <span className="flex items-center gap-1">
                  <IdCard className="size-3.5" aria-hidden />
                  {doc}
                </span>
                {p.edad != null ? <span>{th("yearsOld", { age: p.edad })}</span> : null}
                {p.sexo ? <span>{th(`sex.${p.sexo}`)}</span> : null}
              </div>

              {p.notas ? (
                <p className="mt-2 whitespace-pre-line text-pretty text-sm">
                  {p.notas}
                </p>
              ) : null}

              {p.reportante_nombre || p.reportante_contacto ? (
                <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                  <Phone className="size-3.5" aria-hidden />
                  {t("reporter")}: {[p.reportante_nombre, p.reportante_contacto]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              ) : null}

              <div className="mt-3 border-t pt-3">
                <ModerationActions
                  table="patient_records"
                  id={p.id}
                  moderation={p.moderation}
                />
              </div>
            </div>
          );
        })}
        {list.length === 0 ? (
          <p className="text-muted-foreground">{t("empty")}</p>
        ) : null}
      </div>
    </div>
  );
}
