import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, User } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { TipForm } from "@/components/missing/tip-form";
import { createClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ id: string }> };

async function getPerson(id: string) {
  const numId = Number(id);
  if (!Number.isInteger(numId) || numId < 1) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("missing_persons")
    .select("id, nombre, apellido, foto_url")
    .eq("id", numId)
    .maybeSingle();
  return data ?? null;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const t = await getTranslations("tip");
  const person = await getPerson(id);
  return {
    title: person ? `${t("title")} · ${person.nombre} ${person.apellido}` : "—",
  };
}

export default async function TipPage({ params }: Params) {
  const { id } = await params;
  const person = await getPerson(id);
  if (!person) notFound();

  const t = await getTranslations("tip");
  const nombre = `${person.nombre} ${person.apellido}`;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <Link
        href={`/desaparecidos/${person.id}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {t("backToPerson")}
      </Link>

      <div className="mt-4 flex items-center gap-4">
        <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
          {person.foto_url ? (
            <Image
              src={person.foto_url}
              alt={nombre}
              fill
              sizes="64px"
              className="object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-muted-foreground">
              <User className="size-7" aria-hidden />
            </div>
          )}
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            {t("title")}
          </h1>
          <p className="text-muted-foreground">{t("about", { name: nombre })}</p>
        </div>
      </div>

      <p className="mt-4 rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">
        {t("privacyNote")}
      </p>

      <div className="mt-6">
        <TipForm personId={person.id} />
      </div>
    </div>
  );
}
