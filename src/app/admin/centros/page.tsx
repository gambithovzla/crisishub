import { BadgeCheck, ExternalLink, MapPin, Phone } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { ModBadge } from "@/components/admin/mod-badge";
import { ModerationActions } from "@/components/admin/moderation-actions";
import { createClient } from "@/lib/supabase/server";

export default async function AdminCentrosPage() {
  const t = await getTranslations("admin");
  const th = await getTranslations("health");
  const supabase = await createClient();

  const { data } = await supabase
    .from("health_facilities")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(300);
  const list = data ?? [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">
        {t("section.facilities")}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">{t("listAll")}</p>

      <div className="mt-6 space-y-3">
        {list.map((f) => (
          <div key={f.id} className="rounded-xl border bg-card p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold">
                #{f.id} {f.nombre}
              </span>
              {f.verificado ? (
                <BadgeCheck
                  className="size-4 text-primary"
                  aria-label={th("verified")}
                />
              ) : null}
              <span className="text-sm text-muted-foreground">
                {[th(`facilityType.${f.tipo}`), f.ciudad, f.estado]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
              <ModBadge
                moderation={f.moderation}
                label={t(`moderation.${f.moderation}`)}
              />
            </div>

            {f.capacidad ? (
              <p className="mt-2 whitespace-pre-line text-pretty text-sm">
                {f.capacidad}
              </p>
            ) : null}

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {f.direccion ? (
                <span className="flex items-center gap-1">
                  <MapPin className="size-3.5" aria-hidden />
                  {f.direccion}
                </span>
              ) : null}
              {f.telefono ? (
                <span className="flex items-center gap-1">
                  <Phone className="size-3.5" aria-hidden />
                  {f.telefono}
                </span>
              ) : null}
              {f.url ? (
                <a
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary hover:underline"
                >
                  <ExternalLink className="size-3.5" aria-hidden />
                  {th("website")}
                </a>
              ) : null}
            </div>

            <div className="mt-3 border-t pt-3">
              <ModerationActions
                table="health_facilities"
                id={f.id}
                moderation={f.moderation}
              />
            </div>
          </div>
        ))}
        {list.length === 0 ? (
          <p className="text-muted-foreground">{t("empty")}</p>
        ) : null}
      </div>
    </div>
  );
}
