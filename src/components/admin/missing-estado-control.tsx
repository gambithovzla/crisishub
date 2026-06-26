"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { mergeMissing, setMissingEstado } from "@/app/admin/actions";
import type { PersonStatus } from "@/lib/supabase/types";

const ESTADOS: PersonStatus[] = ["desaparecido", "encontrado_vivo", "fallecido"];
const selectClass =
  "h-9 rounded-lg border border-input bg-background px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

export function MissingEstadoControl({
  id,
  estado,
}: {
  id: number;
  estado: PersonStatus;
}) {
  const t = useTranslations("admin");
  const tm = useTranslations("missing");
  const [pending, startTransition] = useTransition();
  const [mergeId, setMergeId] = useState("");

  function changeEstado(value: PersonStatus) {
    startTransition(async () => {
      const r = await setMissingEstado(id, value);
      if (!r.ok) toast.error(r.error);
      else toast.success(t("done"));
    });
  }

  function doMerge() {
    const target = Number(mergeId);
    if (!Number.isInteger(target) || target < 1) {
      toast.error(t("mergeInvalid"));
      return;
    }
    startTransition(async () => {
      const r = await mergeMissing(id, target);
      if (!r.ok) toast.error(r.error);
      else {
        toast.success(t("done"));
        setMergeId("");
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="flex items-center gap-1.5 text-sm">
        {t("situation")}
        <select
          className={selectClass}
          value={estado}
          disabled={pending}
          onChange={(e) => changeEstado(e.target.value as PersonStatus)}
        >
          {ESTADOS.map((s) => (
            <option key={s} value={s}>
              {tm(`status.${s}`)}
            </option>
          ))}
        </select>
      </label>

      <span className="flex items-center gap-1.5 text-sm">
        {t("mergeInto")}
        <Input
          inputMode="numeric"
          value={mergeId}
          onChange={(e) => setMergeId(e.target.value)}
          placeholder="id"
          className="h-9 w-20"
        />
        <Button
          size="sm"
          variant="outline"
          disabled={pending || mergeId === ""}
          onClick={doMerge}
        >
          {t("merge")}
        </Button>
      </span>
    </div>
  );
}
