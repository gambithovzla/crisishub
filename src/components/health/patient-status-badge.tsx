import { getTranslations } from "next-intl/server";

import { patientStatusStyles } from "@/lib/health";
import { cn } from "@/lib/utils";
import type { PatientStatus } from "@/lib/supabase/types";

export async function PatientStatusBadge({
  estado,
}: {
  estado: PatientStatus;
}) {
  const t = await getTranslations("health");
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        patientStatusStyles[estado],
      )}
    >
      {t(`patientStatus.${estado}`)}
    </span>
  );
}
