import Image from "next/image";
import Link from "next/link";
import { MapPin, User } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { StatusBadge } from "./status-badge";
import type { MissingPerson } from "@/lib/supabase/types";

export async function PersonCard({ person }: { person: MissingPerson }) {
  const t = await getTranslations("missing");
  const lugar = [person.ciudad, person.estado_region]
    .filter(Boolean)
    .join(", ");

  return (
    <Link
      href={`/desaparecidos/${person.id}`}
      className="group block rounded-xl border bg-card transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
    >
      <div className="flex gap-4 p-4">
        <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-muted">
          {person.foto_url ? (
            <Image
              src={person.foto_url}
              alt={`${person.nombre} ${person.apellido}`}
              fill
              sizes="80px"
              className="object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-muted-foreground">
              <User className="size-8" aria-hidden />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="truncate text-lg font-semibold">
            {person.nombre} {person.apellido}
          </h3>
          <StatusBadge estado={person.estado} />
          <div className="space-y-0.5 pt-0.5 text-sm text-muted-foreground">
            {person.edad_aprox != null ? (
              <p>{t("ageYears", { age: person.edad_aprox })}</p>
            ) : null}
            {lugar ? (
              <p className="flex items-center gap-1">
                <MapPin className="size-3.5 shrink-0" aria-hidden />
                {lugar}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </Link>
  );
}
