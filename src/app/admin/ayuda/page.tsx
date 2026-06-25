import { Clock, MapPin, Phone } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { HelpStatusBadge } from "@/components/help/help-status-badge";
import { ModBadge } from "@/components/admin/mod-badge";
import { ModerationActions } from "@/components/admin/moderation-actions";
import { HelpEstadoControl } from "@/components/admin/help-estado-control";
import { helpCategoryEmoji } from "@/lib/help";
import { createClient } from "@/lib/supabase/server";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-VE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function AdminHelpPage() {
  const t = await getTranslations("admin");
  const th = await getTranslations("help");
  const supabase = await createClient();

  const { data } = await supabase
    .from("help_requests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(150);
  const list = data ?? [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">{t("section.help")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t("listAll")}</p>

      <div className="mt-6 space-y-3">
        {list.map((item) => (
          <div key={item.id} className="rounded-xl border bg-card p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 font-semibold">
                <span aria-hidden>{helpCategoryEmoji[item.categoria]}</span>
                {th(`category.${item.categoria}`)}
              </span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {th(`tab.${item.modo}`)}
              </span>
              <HelpStatusBadge estado={item.estado} />
              <ModBadge
                moderation={item.moderation}
                label={t(`moderation.${item.moderation}`)}
              />
            </div>

            <p className="mt-2 whitespace-pre-line text-pretty">
              {item.descripcion}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {item.ubicacion_texto ? (
                <span className="flex items-center gap-1">
                  <MapPin className="size-3.5" aria-hidden />
                  {item.ubicacion_texto}
                </span>
              ) : null}
              {item.contacto ? (
                <span className="flex items-center gap-1">
                  <Phone className="size-3.5" aria-hidden />
                  {item.contacto}
                </span>
              ) : null}
              <span className="flex items-center gap-1">
                <Clock className="size-3.5" aria-hidden />
                {formatDate(item.created_at)}
              </span>
            </div>

            <div className="mt-3 space-y-3 border-t pt-3">
              <HelpEstadoControl id={item.id} estado={item.estado} />
              <ModerationActions
                table="help_requests"
                id={item.id}
                moderation={item.moderation}
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
