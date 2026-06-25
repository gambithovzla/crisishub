import { Clock, ExternalLink, MapPin, Phone } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { ModBadge } from "@/components/admin/mod-badge";
import { ModerationActions } from "@/components/admin/moderation-actions";
import { helpCategoryEmoji } from "@/lib/help";
import { createClient } from "@/lib/supabase/server";

export default async function AdminAcopioPage() {
  const t = await getTranslations("admin");
  const th = await getTranslations("help");
  const ta = await getTranslations("acopio");
  const supabase = await createClient();

  const { data } = await supabase
    .from("collection_points")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  const list = data ?? [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">
        {t("section.acopio")}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">{t("listAll")}</p>

      <div className="mt-6 space-y-3">
        {list.map((point) => (
          <div key={point.id} className="rounded-xl border bg-card p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold">
                #{point.id} {point.nombre}
              </span>
              <span className="text-sm text-muted-foreground">
                {[point.ciudad, point.pais].filter(Boolean).join(", ")}
              </span>
              <ModBadge
                moderation={point.moderation}
                label={t(`moderation.${point.moderation}`)}
              />
            </div>

            {point.categorias.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {point.categorias.map((c) => (
                  <span
                    key={c}
                    className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground"
                  >
                    <span aria-hidden>{helpCategoryEmoji[c]}</span>
                    {th(`category.${c}`)}
                  </span>
                ))}
              </div>
            ) : null}

            {point.instrucciones ? (
              <p className="mt-2 whitespace-pre-line text-pretty text-sm">
                {point.instrucciones}
              </p>
            ) : null}

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {point.direccion ? (
                <span className="flex items-center gap-1">
                  <MapPin className="size-3.5" aria-hidden />
                  {point.direccion}
                </span>
              ) : null}
              {point.horario ? (
                <span className="flex items-center gap-1">
                  <Clock className="size-3.5" aria-hidden />
                  {point.horario}
                </span>
              ) : null}
              {point.contacto ? (
                <span className="flex items-center gap-1">
                  <Phone className="size-3.5" aria-hidden />
                  {point.contacto}
                </span>
              ) : null}
              {point.url ? (
                <a
                  href={point.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary hover:underline"
                >
                  <ExternalLink className="size-3.5" aria-hidden />
                  {ta("website")}
                </a>
              ) : null}
            </div>

            <div className="mt-3 border-t pt-3">
              <ModerationActions
                table="collection_points"
                id={point.id}
                moderation={point.moderation}
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
