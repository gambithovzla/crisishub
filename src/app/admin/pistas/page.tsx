import Image from "next/image";
import Link from "next/link";
import { Clock, ExternalLink, MapPin, Phone, User } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { ModBadge } from "@/components/admin/mod-badge";
import { ModerationActions } from "@/components/admin/moderation-actions";
import { createClient } from "@/lib/supabase/server";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-VE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function AdminTipsPage() {
  const t = await getTranslations("admin");
  const supabase = await createClient();

  const { data } = await supabase
    .from("tips")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(150);
  const list = data ?? [];

  // Nombres de las fichas relacionadas (lote único, tipado limpio).
  const personIds = [...new Set(list.map((tip) => tip.missing_person_id))];
  const { data: persons } = personIds.length
    ? await supabase
        .from("missing_persons")
        .select("id, nombre, apellido")
        .in("id", personIds)
    : { data: [] };
  const personById = new Map(
    (persons ?? []).map((p) => [p.id, `${p.nombre} ${p.apellido}`.trim()]),
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">{t("section.tips")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t("listAll")}</p>

      <div className="mt-6 space-y-3">
        {list.map((tip) => {
          const personName =
            personById.get(tip.missing_person_id) ??
            t("unknownPerson", { id: tip.missing_person_id });
          return (
            <div key={tip.id} className="rounded-xl border bg-card p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {t("tipFor")}
                </span>
                <Link
                  href={`/desaparecidos/${tip.missing_person_id}`}
                  target="_blank"
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  <ExternalLink className="size-3.5" />
                  {personName}
                </Link>
                <ModBadge
                  moderation={tip.moderation}
                  label={t(`moderation.${tip.moderation}`)}
                />
              </div>

              <p className="mt-2 whitespace-pre-line text-pretty">
                {tip.informacion}
              </p>

              {tip.foto_url ? (
                <div className="relative mt-3 aspect-video max-w-sm overflow-hidden rounded-lg bg-muted">
                  <Image
                    src={tip.foto_url}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, 384px"
                    className="object-cover"
                  />
                </div>
              ) : null}

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {tip.nombre ? (
                  <span className="flex items-center gap-1">
                    <User className="size-3.5" aria-hidden />
                    {tip.nombre}
                  </span>
                ) : null}
                {tip.telefono ? (
                  <a
                    href={`tel:${tip.telefono}`}
                    className="flex items-center gap-1 text-primary hover:underline"
                  >
                    <Phone className="size-3.5" aria-hidden />
                    {tip.telefono}
                  </a>
                ) : null}
                {tip.ubicacion_texto ? (
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3.5" aria-hidden />
                    {tip.ubicacion_texto}
                  </span>
                ) : null}
                <span className="flex items-center gap-1">
                  <Clock className="size-3.5" aria-hidden />
                  {formatDate(tip.created_at)}
                </span>
              </div>

              <div className="mt-3 border-t pt-3">
                <ModerationActions
                  table="tips"
                  id={tip.id}
                  moderation={tip.moderation}
                />
              </div>
            </div>
          );
        })}
        {list.length === 0 ? (
          <p className="text-muted-foreground">{t("empty")}</p>
        ) : null}
      </div>
    </div>
  );
}
