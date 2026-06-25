import { Clock, MapPin, Phone } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { HelpStatusBadge } from "./help-status-badge";
import { helpCategoryEmoji } from "@/lib/help";
import type { HelpRequest } from "@/lib/supabase/types";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-VE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

const isPhone = (s: string) => /^[0-9+()\s-]{7,}$/.test(s);

export async function HelpCard({ item }: { item: HelpRequest }) {
  const t = await getTranslations("help");

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 font-semibold">
          <span aria-hidden>{helpCategoryEmoji[item.categoria]}</span>
          {t(`category.${item.categoria}`)}
        </span>
        <HelpStatusBadge estado={item.estado} />
      </div>

      <p className="mt-2 whitespace-pre-line text-pretty">{item.descripcion}</p>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
        {item.ubicacion_texto ? (
          <span className="flex items-center gap-1">
            <MapPin className="size-3.5" aria-hidden />
            {item.ubicacion_texto}
          </span>
        ) : null}
        <span className="flex items-center gap-1">
          <Clock className="size-3.5" aria-hidden />
          {formatDate(item.created_at)}
        </span>
      </div>

      {item.contacto ? (
        <div className="mt-3 flex items-center gap-1.5 text-sm">
          <Phone className="size-4 text-muted-foreground" aria-hidden />
          {isPhone(item.contacto) ? (
            <a
              href={`tel:${item.contacto}`}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {item.contacto}
            </a>
          ) : (
            <span className="font-medium">{item.contacto}</span>
          )}
        </div>
      ) : null}
    </div>
  );
}
