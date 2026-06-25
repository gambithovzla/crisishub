import Image from "next/image";
import { Clock, MapPin } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { createClient } from "@/lib/supabase/server";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-VE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export async function TipsList({ personId }: { personId: number }) {
  const t = await getTranslations("tip");
  const supabase = await createClient();

  // Nota de privacidad: NO seleccionamos nombre/teléfono del informante.
  // Esos datos quedan para los moderadores (Fase 8).
  const { data } = await supabase
    .from("tips")
    .select("id, informacion, ubicacion_texto, foto_url, lat, lng, created_at")
    .eq("missing_person_id", personId)
    .order("created_at", { ascending: false });
  const tips = data ?? [];

  if (tips.length === 0) return null;

  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold">
        {t("listTitle", { count: tips.length })}
      </h2>
      <ul className="mt-3 space-y-3">
        {tips.map((tip) => (
          <li key={tip.id} className="rounded-xl border bg-card p-4">
            <p className="whitespace-pre-line text-pretty">{tip.informacion}</p>
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
              {tip.lat != null && tip.lng != null ? (
                <a
                  href={`https://www.openstreetmap.org/?mlat=${tip.lat}&mlon=${tip.lng}#map=16/${tip.lat}/${tip.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  {t("viewOnMap")}
                </a>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
