import { getTranslations } from "next-intl/server";

import { VolunteerAdminActions } from "@/components/admin/volunteer-admin-actions";
import { professionEmoji } from "@/lib/professions";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Profesionales" };

export default async function AdminVolunteersPage() {
  const t = await getTranslations("professionals");
  const supabase = await createClient();
  const { data } = await supabase
    .from("volunteers")
    .select("*")
    .order("verified", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(200);
  const list = data ?? [];

  const pendientes = list.filter((v) => !v.verified).length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">Profesionales</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Revisa la credencial y verifica. Solo los verificados aparecen al
        público. Pendientes por revisar: <strong>{pendientes}</strong>.
      </p>

      <div className="mt-6 space-y-3">
        {list.map((v) => (
          <div key={v.id} className="rounded-xl border bg-card p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold">
                #{v.id} {professionEmoji[v.profesion]} {v.nombre}
              </span>
              <span className="text-sm text-muted-foreground">
                {t(`profession.${v.profesion}`)}
                {v.especialidad ? ` · ${v.especialidad}` : ""}
              </span>
              {v.verified ? (
                <span className="rounded-full bg-success/15 px-2 py-0.5 text-xs font-semibold text-success">
                  Verificado
                </span>
              ) : (
                <span className="rounded-full bg-warning/15 px-2 py-0.5 text-xs font-semibold text-warning">
                  Sin verificar
                </span>
              )}
              {v.moderation !== "visible" ? (
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {v.moderation}
                </span>
              ) : null}
            </div>

            <dl className="mt-2 grid gap-x-6 gap-y-1 text-sm text-muted-foreground sm:grid-cols-2">
              <p>Contacto: {v.contacto}</p>
              {v.zona ? <p>Zona: {v.zona}</p> : null}
              {v.colegio_numero ? <p>Colegiatura: {v.colegio_numero}</p> : null}
              {v.modalidades.length ? (
                <p>Modalidades: {v.modalidades.join(", ")}</p>
              ) : null}
            </dl>
            {v.bio ? (
              <p className="mt-2 text-sm whitespace-pre-line">{v.bio}</p>
            ) : null}

            <div className="mt-3 border-t pt-3">
              <VolunteerAdminActions
                id={v.id}
                verified={v.verified}
                moderation={v.moderation}
              />
            </div>
          </div>
        ))}
        {list.length === 0 ? (
          <p className="text-muted-foreground">No hay profesionales registrados.</p>
        ) : null}
      </div>
    </div>
  );
}
