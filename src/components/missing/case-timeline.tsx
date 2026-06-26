import { Clock, FileText, Info, MapPinned } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { createClient } from "@/lib/supabase/server";
import type { MissingPerson } from "@/lib/supabase/types";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-VE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

type TimelineEvent = {
  at: string;
  label: string;
  icon: typeof Clock;
};

/**
 * Cronología del caso a partir de datos que ya existen: último contacto,
 * publicación del reporte, pistas recibidas y cambio de estado (si lo hubo).
 */
export async function CaseTimeline({ person }: { person: MissingPerson }) {
  const t = await getTranslations("missing");
  const supabase = await createClient();

  const { data: tips } = await supabase
    .from("tips")
    .select("id, created_at")
    .eq("missing_person_id", person.id)
    .order("created_at", { ascending: true });

  const events: TimelineEvent[] = [];

  if (person.ultimo_contacto_at) {
    events.push({
      at: person.ultimo_contacto_at,
      label: t("evLastContact"),
      icon: MapPinned,
    });
  }

  events.push({
    at: person.created_at,
    label: t("evReported"),
    icon: FileText,
  });

  for (const tip of tips ?? []) {
    events.push({ at: tip.created_at, label: t("evTip"), icon: Info });
  }

  // Cambio de estado (encontrado/fallecido): usamos updated_at como aproximación.
  if (person.estado !== "desaparecido") {
    events.push({
      at: person.updated_at,
      label: t(`status.${person.estado}`),
      icon: Clock,
    });
  }

  events.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

  // Si solo hay un hito, no aporta como "cronología".
  if (events.length < 2) return null;

  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold">{t("timelineTitle")}</h2>
      <ol className="mt-4 space-y-0">
        {events.map((ev, i) => {
          const Icon = ev.icon;
          const isLast = i === events.length - 1;
          return (
            <li key={`${ev.at}-${i}`} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full border bg-card text-muted-foreground">
                  <Icon className="size-4" aria-hidden />
                </span>
                {!isLast ? <span className="w-px flex-1 bg-border" /> : null}
              </div>
              <div className={isLast ? "pb-0" : "pb-5"}>
                <p className="font-medium leading-tight">{ev.label}</p>
                <p className="mt-0.5 text-sm text-muted-foreground tabular-nums">
                  {formatDate(ev.at)}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
