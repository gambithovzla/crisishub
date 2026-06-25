import { Clock, ExternalLink, Info, MapPin, Phone } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { helpCategoryEmoji } from "@/lib/help";
import type { CollectionPoint } from "@/lib/supabase/types";

const isPhone = (s: string) => /^[0-9+()\s-]{7,}$/.test(s);

export async function CollectionPointCard({
  point,
}: {
  point: CollectionPoint;
}) {
  const t = await getTranslations("acopio");
  const th = await getTranslations("help");

  return (
    <div className="rounded-xl border bg-card p-4">
      <h3 className="text-lg font-semibold">{point.nombre}</h3>
      {point.ciudad ? (
        <p className="text-sm text-muted-foreground">{point.ciudad}</p>
      ) : null}

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

      <dl className="mt-3 space-y-2 text-sm">
        {point.direccion ? (
          <div className="flex gap-2">
            <MapPin className="size-4 shrink-0 text-muted-foreground" />
            {point.lat != null && point.lng != null ? (
              <a
                href={`https://www.openstreetmap.org/?mlat=${point.lat}&mlon=${point.lng}#map=16/${point.lat}/${point.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline-offset-4 hover:underline"
              >
                {point.direccion}
              </a>
            ) : (
              <span>{point.direccion}</span>
            )}
          </div>
        ) : null}
        {point.horario ? (
          <div className="flex gap-2">
            <Clock className="size-4 shrink-0 text-muted-foreground" />
            <span>{point.horario}</span>
          </div>
        ) : null}
        {point.instrucciones ? (
          <div className="flex gap-2">
            <Info className="size-4 shrink-0 text-muted-foreground" />
            <span className="whitespace-pre-line text-pretty">
              {point.instrucciones}
            </span>
          </div>
        ) : null}
      </dl>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        {point.contacto ? (
          <span className="flex items-center gap-1.5">
            <Phone className="size-4 text-muted-foreground" />
            {isPhone(point.contacto) ? (
              <a
                href={`tel:${point.contacto}`}
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                {point.contacto}
              </a>
            ) : (
              <span className="font-medium">{point.contacto}</span>
            )}
          </span>
        ) : null}
        {point.url ? (
          <a
            href={point.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
          >
            <ExternalLink className="size-4" />
            {t("website")}
          </a>
        ) : null}
      </div>
    </div>
  );
}
