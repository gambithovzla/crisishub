import { getTranslations } from "next-intl/server";

import { StaffApplicationActions } from "@/components/admin/staff-application-actions";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function StaffApplicationsPage() {
  await requireAdmin();
  const t = await getTranslations("admin");

  const admin = createAdminClient();
  const { data: applications } = await admin
    .from("staff_applications")
    .select("*")
    .eq("estado", "pendiente")
    .order("created_at", { ascending: true });

  const list = applications ?? [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">
        {t("staffApplications.title")}
      </h1>
      <p className="mt-1 text-muted-foreground">
        {t("staffApplications.intro")}
      </p>

      {list.length === 0 ? (
        <p className="mt-8 text-muted-foreground">
          {t("staffApplications.empty")}
        </p>
      ) : (
        <ul className="mt-6 space-y-4">
          {list.map((app) => (
            <li
              key={app.id}
              className="rounded-lg border bg-card p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{app.nombre}</p>
                  <p className="text-sm text-muted-foreground">{app.email}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {t("staffApplications.submittedAt", {
                      date: new Date(app.created_at).toLocaleString("es-VE"),
                    })}
                  </p>
                </div>
                <StaffApplicationActions application={app} />
              </div>
              {app.mensaje ? (
                <p className="mt-3 rounded-md bg-muted/40 px-3 py-2 text-sm">
                  {app.mensaje}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
