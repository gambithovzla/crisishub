"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { setHelpEstado } from "@/app/admin/actions";
import { HELP_STATUSES } from "@/lib/help";
import type { HelpStatus } from "@/lib/supabase/types";

const selectClass =
  "h-9 rounded-lg border border-input bg-background px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

export function HelpEstadoControl({
  id,
  estado,
}: {
  id: number;
  estado: HelpStatus;
}) {
  const t = useTranslations("admin");
  const th = useTranslations("help");
  const [pending, startTransition] = useTransition();

  return (
    <label className="flex items-center gap-1.5 text-sm">
      {t("statusLabel")}
      <select
        className={selectClass}
        value={estado}
        disabled={pending}
        onChange={(e) =>
          startTransition(async () => {
            const r = await setHelpEstado(id, e.target.value as HelpStatus);
            if (!r.ok) toast.error(r.error);
            else toast.success(t("done"));
          })
        }
      >
        {HELP_STATUSES.map((s) => (
          <option key={s} value={s}>
            {th(`status.${s}`)}
          </option>
        ))}
      </select>
    </label>
  );
}
