import { getTranslations } from "next-intl/server";

import { getStats } from "@/lib/stats";

/**
 * Contador de confianza. Muestra SOLO cifras reales: oculta cada métrica en 0
 * y la barra entera si todavía no hay datos (para no mostrar "0 localizadas"
 * recién lanzada la app).
 */
export async function StatsBar() {
  const t = await getTranslations("home");
  const s = await getStats();

  const items = [
    { value: s.reported, label: t("statsReported") },
    { value: s.found, label: t("statsFound") },
    { value: s.helpResolved, label: t("statsHelpResolved") },
    { value: s.volunteers, label: t("statsVolunteers") },
  ].filter((it) => it.value > 0);

  if (items.length === 0) return null;

  const nf = new Intl.NumberFormat("es-VE");

  return (
    <section className="mt-4">
      <dl className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
        {items.map((it) => (
          <div
            key={it.label}
            className="rounded-2xl border bg-card p-5 text-center sm:flex-1"
          >
            <dt className="text-3xl font-bold tabular-nums sm:text-4xl">
              {nf.format(it.value)}
            </dt>
            <dd className="mt-1 text-sm text-muted-foreground text-pretty">
              {it.label}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
