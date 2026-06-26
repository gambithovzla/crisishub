"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Check, X } from "lucide-react";

import {
  approveStaffApplication,
  rejectStaffApplication,
} from "@/app/admin/solicitudes/actions";
import { Button } from "@/components/ui/button";
import type { StaffApplication, UserRole } from "@/lib/supabase/types";

export function StaffApplicationActions({
  application,
}: {
  application: StaffApplication;
}) {
  const t = useTranslations("admin");
  const [pending, startTransition] = useTransition();
  const [rol, setRol] = useState<UserRole>("moderador");

  function run(
    fn: () => Promise<{ ok: boolean; error?: string }>,
    successKey: string,
  ) {
    startTransition(async () => {
      const r = await fn();
      if (!r.ok) {
        const known = ["notFound", "alreadyReviewed", "alreadyStaff"] as const;
        const msg = known.includes(r.error as (typeof known)[number])
          ? t(`staffApplications.errors.${r.error}`)
          : (r.error ?? t("error"));
        toast.error(msg);
        return;
      }
      toast.success(t(successKey));
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="sr-only" htmlFor={`rol-${application.id}`}>
        {t("staffApplications.roleLabel")}
      </label>
      <select
        id={`rol-${application.id}`}
        value={rol}
        disabled={pending}
        onChange={(e) => setRol(e.target.value as UserRole)}
        className="h-9 rounded-md border border-input bg-background px-2 text-sm"
      >
        <option value="moderador">{t("role.moderador")}</option>
        <option value="admin">{t("role.admin")}</option>
      </select>

      <Button
        size="sm"
        disabled={pending}
        onClick={() =>
          run(
            () => approveStaffApplication(application.id, rol),
            "staffApplications.approved",
          )
        }
      >
        <Check className="size-4" />
        {t("staffApplications.approve")}
      </Button>

      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => {
          if (!confirm(t("staffApplications.confirmReject"))) return;
          run(
            () => rejectStaffApplication(application.id),
            "staffApplications.rejected",
          );
        }}
      >
        <X className="size-4" />
        {t("staffApplications.reject")}
      </Button>
    </div>
  );
}
