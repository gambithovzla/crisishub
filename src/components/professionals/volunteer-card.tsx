import { BadgeCheck, MapPin, MessageCircle, Phone } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { professionEmoji } from "@/lib/professions";
import type { VolunteerPublic } from "@/lib/supabase/types";

const isPhone = (s: string) => /^[0-9+()\s-]{7,}$/.test(s);
function whatsappLink(phone: string) {
  let d = phone.replace(/\D/g, "");
  if (d.startsWith("0")) d = "58" + d.slice(1);
  return `https://wa.me/${d}`;
}

export async function VolunteerCard({ v }: { v: VolunteerPublic }) {
  const t = await getTranslations("professionals");

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="flex items-center gap-1.5 font-semibold">
            <span aria-hidden>{professionEmoji[v.profesion]}</span>
            {v.nombre}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t(`profession.${v.profesion}`)}
            {v.especialidad ? ` · ${v.especialidad}` : ""}
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-xs font-semibold text-success">
          <BadgeCheck className="size-3.5" />
          {t("verified")}
        </span>
      </div>

      {v.bio ? (
        <p className="mt-2 text-sm whitespace-pre-line text-pretty">{v.bio}</p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-1.5">
        {v.modalidades.map((m) => (
          <span
            key={m}
            className="rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground"
          >
            {t(`modalidad.${m}`)}
          </span>
        ))}
      </div>

      <div className="mt-3 space-y-1 text-sm text-muted-foreground">
        {v.zona ? (
          <p className="flex items-center gap-1">
            <MapPin className="size-3.5" aria-hidden />
            {v.zona}
          </p>
        ) : null}
        {v.idiomas ? <p>{t("languages")}: {v.idiomas}</p> : null}
        {v.colegio_numero ? (
          <p>{t("license")}: {v.colegio_numero}</p>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {isPhone(v.contacto) ? (
          <>
            <a
              href={`tel:${v.contacto}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
            >
              <Phone className="size-4" />
              {v.contacto}
            </a>
            <a
              href={whatsappLink(v.contacto)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium"
            >
              <MessageCircle className="size-4" />
              WhatsApp
            </a>
          </>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium">
            <Phone className="size-4 text-muted-foreground" />
            {v.contacto}
          </span>
        )}
      </div>
    </div>
  );
}
