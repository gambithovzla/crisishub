import Image from "next/image";
import Link from "next/link";
import { ExternalLink, User } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { ModBadge } from "@/components/admin/mod-badge";
import { ModerationActions } from "@/components/admin/moderation-actions";
import { MissingEstadoControl } from "@/components/admin/missing-estado-control";
import { StatusBadge } from "@/components/missing/status-badge";
import { createClient } from "@/lib/supabase/server";

export default async function AdminMissingPage() {
  const t = await getTranslations("admin");
  const supabase = await createClient();
  const { data } = await supabase
    .from("missing_persons")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(150);
  const list = data ?? [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">{t("section.missing")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t("listAll")}</p>

      <div className="mt-6 space-y-3">
        {list.map((p) => (
          <div key={p.id} className="rounded-xl border bg-card p-4">
            <div className="flex gap-3">
              <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                {p.foto_url ? (
                  <Image src={p.foto_url} alt="" fill sizes="56px" className="object-cover" />
                ) : (
                  <div className="flex size-full items-center justify-center text-muted-foreground">
                    <User className="size-6" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">
                    #{p.id} {p.nombre} {p.apellido}
                  </span>
                  <StatusBadge estado={p.estado} />
                  <ModBadge moderation={p.moderation} label={t(`moderation.${p.moderation}`)} />
                </div>
                <Link
                  href={`/desaparecidos/${p.id}`}
                  target="_blank"
                  className="mt-1 inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="size-3.5" />
                  {t("viewPublic")}
                </Link>
              </div>
            </div>

            <div className="mt-3 space-y-3 border-t pt-3">
              <MissingEstadoControl id={p.id} estado={p.estado} />
              <ModerationActions table="missing_persons" id={p.id} moderation={p.moderation} />
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
