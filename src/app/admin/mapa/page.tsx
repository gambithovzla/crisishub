import Image from "next/image";
import { Clock, MapPin, User } from "lucide-react";
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

export default async function AdminMarkersPage() {
  const t = await getTranslations("admin");
  const tm = await getTranslations("map");
  const supabase = await createClient();

  const { data } = await supabase
    .from("map_markers")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  const list = data ?? [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">
        {t("section.markers")}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">{t("listAll")}</p>

      <div className="mt-6 space-y-3">
        {list.map((marker) => (
          <div key={marker.id} className="rounded-xl border bg-card p-4">
            <div className="flex gap-3">
              {marker.foto_url ? (
                <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                  <Image
                    src={marker.foto_url}
                    alt=""
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                </div>
              ) : null}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">
                    #{marker.id} {tm(`type.${marker.tipo}`)}
                  </span>
                  <ModBadge
                    moderation={marker.moderation}
                    label={t(`moderation.${marker.moderation}`)}
                  />
                </div>
                {marker.descripcion ? (
                  <p className="mt-1 whitespace-pre-line text-pretty text-sm">
                    {marker.descripcion}
                  </p>
                ) : null}
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <User className="size-3.5" aria-hidden />
                    {marker.usuario || tm("popup.anon")}
                  </span>
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${marker.lat}&mlon=${marker.lng}#map=16/${marker.lat}/${marker.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary hover:underline"
                  >
                    <MapPin className="size-3.5" aria-hidden />
                    {marker.lat.toFixed(5)}, {marker.lng.toFixed(5)}
                  </a>
                  <span className="flex items-center gap-1">
                    <Clock className="size-3.5" aria-hidden />
                    {formatDate(marker.created_at)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-3 border-t pt-3">
              <ModerationActions
                table="map_markers"
                id={marker.id}
                moderation={marker.moderation}
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
