import { BadgeCheck, ExternalLink, MapPin, Phone } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { facilityTypeEmoji } from "@/lib/health";
import type { HealthFacility } from "@/lib/supabase/types";

const isPhone = (s: string) => /^[0-9+()\s-]{7,}$/.test(s);

export async function FacilityCard({
  facility,
}: {
  facility: HealthFacility;
}) {
  const t = await getTranslations("health");

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-start gap-2">
        <span aria-hidden className="text-lg leading-none">
          {facilityTypeEmoji[facility.tipo]}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold leading-tight">
            {facility.nombre}
            {facility.verificado ? (
              <BadgeCheck
                className="ml-1 inline size-4 text-primary"
                aria-label={t("verified")}
              />
            ) : null}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t(`facilityType.${facility.tipo}`)}
            {facility.ciudad ? ` · ${facility.ciudad}` : ""}
          </p>
        </div>
      </div>

      {facility.capacidad ? (
        <p className="mt-2 text-sm text-pretty">{facility.capacidad}</p>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        {facility.direccion ? (
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="size-4 shrink-0" aria-hidden />
            {facility.lat != null && facility.lng != null ? (
              <a
                href={`https://www.openstreetmap.org/?mlat=${facility.lat}&mlon=${facility.lng}#map=16/${facility.lat}/${facility.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline-offset-4 hover:underline"
              >
                {facility.direccion}
              </a>
            ) : (
              <span>{facility.direccion}</span>
            )}
          </span>
        ) : null}
        {facility.telefono ? (
          <span className="flex items-center gap-1.5">
            <Phone className="size-4 text-muted-foreground" aria-hidden />
            {isPhone(facility.telefono) ? (
              <a
                href={`tel:${facility.telefono}`}
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                {facility.telefono}
              </a>
            ) : (
              <span className="font-medium">{facility.telefono}</span>
            )}
          </span>
        ) : null}
        {facility.url ? (
          <a
            href={facility.url}
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
