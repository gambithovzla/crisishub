"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Eye, EyeOff, Flag, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { removeRecord, setModeration } from "@/app/admin/actions";
import type { ModerationStatus } from "@/lib/supabase/types";

type Table =
  | "missing_persons"
  | "tips"
  | "map_markers"
  | "help_requests"
  | "collection_points";

export function ModerationActions({
  table,
  id,
  moderation,
}: {
  table: Table;
  id: number;
  moderation: ModerationStatus;
}) {
  const t = useTranslations("admin");
  const [pending, startTransition] = useTransition();

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    startTransition(async () => {
      const r = await fn();
      if (!r.ok) toast.error(r.error ?? t("error"));
      else toast.success(t("done"));
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {moderation === "visible" ? (
        <>
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => run(() => setModeration(table, id, "hidden"))}
          >
            <EyeOff className="size-4" />
            {t("hide")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => run(() => setModeration(table, id, "false_info"))}
          >
            <Flag className="size-4" />
            {t("markFalse")}
          </Button>
        </>
      ) : (
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => run(() => setModeration(table, id, "visible"))}
        >
          <Eye className="size-4" />
          {t("show")}
        </Button>
      )}
      <Button
        size="sm"
        variant="destructive"
        disabled={pending}
        onClick={() => {
          if (confirm(t("confirmDelete"))) run(() => removeRecord(table, id));
        }}
      >
        <Trash2 className="size-4" />
        {t("delete")}
      </Button>
    </div>
  );
}
