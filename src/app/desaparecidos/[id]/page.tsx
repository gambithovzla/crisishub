import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  Info,
  MapPin,
  MessageCircle,
  Phone,
  User,
} from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/missing/status-badge";
import { TipsList } from "@/components/missing/tips-list";
import { createClient } from "@/lib/supabase/server";
import type { MissingPerson } from "@/lib/supabase/types";

type Params = { params: Promise<{ id: string }> };

async function getPerson(id: string): Promise<MissingPerson | null> {
  const numId = Number(id);
  if (!Number.isInteger(numId) || numId < 1) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("missing_persons")
    .select("*")
    .eq("id", numId)
    .maybeSingle();
  return data ?? null;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const person = await getPerson(id);
  if (!person) return { title: "—" };

  const t = await getTranslations("missing");
  const nombre = `${person.nombre} ${person.apellido}`;
  const lugar = [person.ciudad, person.estado_region].filter(Boolean).join(", ");
  const description = t("ogDescription", {
    name: nombre,
    place: lugar || "—",
  });

  return {
    title: `${nombre} — ${t(`status.${person.estado}`)}`,
    description,
    openGraph: {
      title: nombre,
      description,
      type: "profile",
      images: person.foto_url ? [{ url: person.foto_url }] : undefined,
    },
  };
}

function formatDate(value: string | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat("es-VE", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(value));
}

function whatsappLink(phone: string) {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = "58" + digits.slice(1);
  return `https://wa.me/${digits}`;
}

export default async function PersonDetailPage({ params }: Params) {
  const { id } = await params;
  const person = await getPerson(id);
  if (!person) notFound();

  const t = await getTranslations("missing");
  const nombre = `${person.nombre} ${person.apellido}`;
  const lugar = [person.ciudad, person.estado_region].filter(Boolean).join(", ");
  const fecha = formatDate(person.ultimo_contacto_at);
  const hasLastContact =
    person.ultima_ubicacion_texto ||
    fecha ||
    person.ultimo_contacto_medio ||
    person.ultimo_contacto_actividad ||
    person.ultima_lat;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <Link
        href="/desaparecidos"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {t("backToList")}
      </Link>

      {/* Cabecera */}
      <div className="mt-4 flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left">
        <div className="relative size-40 shrink-0 overflow-hidden rounded-xl bg-muted">
          {person.foto_url ? (
            <Image
              src={person.foto_url}
              alt={nombre}
              fill
              sizes="160px"
              priority
              className="object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-muted-foreground">
              <User className="size-16" aria-hidden />
            </div>
          )}
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {nombre}
          </h1>
          <StatusBadge estado={person.estado} className="mx-auto sm:mx-0" />
          <div className="space-y-0.5 text-muted-foreground">
            {person.edad_aprox != null ? (
              <p>{t("ageYears", { age: person.edad_aprox })}</p>
            ) : null}
            {lugar ? (
              <p className="flex items-center justify-center gap-1 sm:justify-start">
                <MapPin className="size-4" aria-hidden />
                {lugar}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {/* Botón gigante "Tengo información" */}
      <Button
        render={<Link href={`/desaparecidos/${person.id}/tengo-informacion`} />}
        size="lg"
        className="mt-6 h-16 w-full text-lg"
      >
        <Info className="size-6" />
        {t("haveInfo")}
      </Button>

      {/* Pistas aportadas por la gente */}
      <TipsList personId={person.id} />

      {/* Descripción */}
      {person.descripcion ? (
        <section className="mt-8">
          <h2 className="text-lg font-semibold">{t("label.descripcion")}</h2>
          <p className="mt-2 whitespace-pre-line text-pretty">
            {person.descripcion}
          </p>
        </section>
      ) : null}

      {/* Último contacto */}
      {hasLastContact ? (
        <section className="mt-8 rounded-xl border border-warning/40 bg-warning/5 p-5">
          <h2 className="text-lg font-semibold">{t("section.lastContact")}</h2>
          <dl className="mt-3 space-y-3 text-sm">
            {person.ultima_ubicacion_texto ? (
              <div className="flex gap-2">
                <MapPin className="size-4 shrink-0 text-muted-foreground" />
                <span>{person.ultima_ubicacion_texto}</span>
              </div>
            ) : null}
            {fecha ? (
              <div className="flex gap-2">
                <Clock className="size-4 shrink-0 text-muted-foreground" />
                <span>{fecha}</span>
              </div>
            ) : null}
            {person.ultimo_contacto_medio ? (
              <div className="flex gap-2">
                <MessageCircle className="size-4 shrink-0 text-muted-foreground" />
                <span>{t(`contactMethod.${person.ultimo_contacto_medio}`)}</span>
              </div>
            ) : null}
            {person.ultimo_contacto_actividad ? (
              <p className="text-pretty">{person.ultimo_contacto_actividad}</p>
            ) : null}
            {person.ultima_lat != null && person.ultima_lng != null ? (
              <a
                href={`https://www.openstreetmap.org/?mlat=${person.ultima_lat}&mlon=${person.ultima_lng}#map=16/${person.ultima_lat}/${person.ultima_lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
              >
                <MapPin className="size-4" />
                {t("viewOnMap")}
              </a>
            ) : null}
          </dl>
        </section>
      ) : null}

      {/* Contacto del familiar */}
      <section className="mt-8 rounded-xl border bg-card p-5">
        <h2 className="text-lg font-semibold">{t("section.reporter")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("contactFamilyHint")}
        </p>
        <p className="mt-3 font-medium">{person.familiar_nombre}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button render={<a href={`tel:${person.familiar_telefono}`} />}>
            <Phone className="size-4" />
            {person.familiar_telefono}
          </Button>
          <Button
            variant="outline"
            render={
              <a
                href={whatsappLink(person.familiar_telefono)}
                target="_blank"
                rel="noopener noreferrer"
              />
            }
          >
            <MessageCircle className="size-4" />
            WhatsApp
          </Button>
        </div>
      </section>
    </div>
  );
}
