import { getTranslations } from "next-intl/server";

import { cn } from "@/lib/utils";
import type { PersonStatus } from "@/lib/supabase/types";

const styles: Record<PersonStatus, string> = {
  desaparecido: "bg-status-missing/15 text-status-missing ring-status-missing/30",
  encontrado_vivo: "bg-status-found/15 text-status-found ring-status-found/30",
  fallecido: "bg-status-deceased/15 text-status-deceased ring-status-deceased/30",
};

export async function StatusBadge({
  estado,
  className,
}: {
  estado: PersonStatus;
  className?: string;
}) {
  const t = await getTranslations("missing.status");
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
        styles[estado],
        className,
      )}
    >
      {t(estado)}
    </span>
  );
}
