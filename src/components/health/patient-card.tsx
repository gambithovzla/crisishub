import { Hospital, IdCard, User } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { PatientStatusBadge } from "@/components/health/patient-status-badge";
import { documentPrefix } from "@/lib/health";
import type { PatientPublic } from "@/lib/supabase/types";

export async function PatientCard({ patient }: { patient: PatientPublic }) {
  const t = await getTranslations("health");

  const doc =
    patient.documento_masked &&
    patient.documento_tipo !== "sin_documento"
      ? `${documentPrefix[patient.documento_tipo]}${patient.documento_masked}`
      : null;

  const meta = [
    patient.edad != null ? t("yearsOld", { age: patient.edad }) : null,
    patient.sexo ? t(`sex.${patient.sexo}`) : null,
  ].filter(Boolean);

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2">
          <User className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden />
          <div className="min-w-0">
            <h3 className="font-semibold leading-tight">{patient.nombre}</h3>
            {meta.length > 0 ? (
              <p className="text-sm text-muted-foreground">
                {meta.join(" · ")}
              </p>
            ) : null}
          </div>
        </div>
        <PatientStatusBadge estado={patient.estado} />
      </div>

      <dl className="mt-3 space-y-1.5 text-sm">
        {patient.facility_nombre ? (
          <div className="flex items-center gap-2">
            <Hospital className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <span>{patient.facility_nombre}</span>
          </div>
        ) : null}
        {doc ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <IdCard className="size-4 shrink-0" aria-hidden />
            <span className="tabular-nums">{doc}</span>
          </div>
        ) : null}
      </dl>
    </div>
  );
}
