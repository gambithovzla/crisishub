import Link from "next/link";
import { Globe, LifeBuoy, MapPin, MessageCircle, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { createClient } from "@/lib/supabase/server";

async function counts() {
  const supabase = await createClient();
  const tables = [
    "missing_persons",
    "tips",
    "map_markers",
    "help_requests",
    "collection_points",
  ] as const;

  const entries = await Promise.all(
    tables.map(async (table) => {
      const total = await supabase
        .from(table)
        .select("*", { count: "exact", head: true });
      const hidden = await supabase
        .from(table)
        .select("*", { count: "exact", head: true })
        .in("moderation", ["hidden", "false_info"]);
      return [table, { total: total.count ?? 0, hidden: hidden.count ?? 0 }] as const;
    }),
  );
  return Object.fromEntries(entries) as Record<
    (typeof tables)[number],
    { total: number; hidden: number }
  >;
}

const cards = [
  { table: "missing_persons", href: "/admin/desaparecidos", key: "missing", icon: Users },
  { table: "tips", href: "/admin/pistas", key: "tips", icon: MessageCircle },
  { table: "map_markers", href: "/admin/mapa", key: "markers", icon: MapPin },
  { table: "help_requests", href: "/admin/ayuda", key: "help", icon: LifeBuoy },
  { table: "collection_points", href: "/admin/acopio", key: "acopio", icon: Globe },
] as const;

export default async function AdminDashboard() {
  const t = await getTranslations("admin");
  const c = await counts();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">{t("dashboard")}</h1>
      <p className="mt-1 text-muted-foreground">{t("dashboardIntro")}</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => {
          const data = c[card.table];
          return (
            <Link
              key={card.href}
              href={card.href}
              className="rounded-xl border bg-card p-5 transition-colors hover:border-primary"
            >
              <div className="flex items-center gap-2 text-muted-foreground">
                <card.icon className="size-5" />
                <span className="font-medium text-foreground">
                  {t(`section.${card.key}`)}
                </span>
              </div>
              <p className="mt-3 text-3xl font-bold">{data.total}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {data.hidden > 0
                  ? t("hiddenCount", { count: data.hidden })
                  : t("allVisible")}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
