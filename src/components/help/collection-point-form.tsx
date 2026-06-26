"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createCollectionPoint } from "@/app/ayuda/acopio/actions";
import { PAISES } from "@/lib/countries";
import { HELP_CATEGORIES, helpCategoryEmoji } from "@/lib/help";
import {
  collectionPointSchema,
  type CollectionPointInput,
} from "@/lib/validations/collection-point";

const selectClass =
  "flex h-11 w-full rounded-lg border border-input bg-background px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

function ErrorText({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-sm font-medium text-destructive">{msg}</p>;
}

export function CollectionPointForm() {
  const t = useTranslations("acopio");
  const th = useTranslations("help");
  const tm = useTranslations("missing");
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);
  const [located, setLocated] = useState(false);

  const form = useForm<CollectionPointInput>({
    resolver: zodResolver(collectionPointSchema),
    defaultValues: {
      pais: "",
      ciudad: "",
      nombre: "",
      direccion: "",
      lat: "",
      lng: "",
      categorias: [],
      instrucciones: "",
      horario: "",
      contacto: "",
      url: "",
    },
  });
  const { register, handleSubmit, setValue, formState } = form;

  function captureLocation() {
    if (!("geolocation" in navigator)) {
      toast.error(tm("locationUnsupported"));
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setValue("lat", String(p.coords.latitude));
        setValue("lng", String(p.coords.longitude));
        setLocating(false);
        setLocated(true);
        toast.success(tm("locationCaptured"));
      },
      () => {
        setLocating(false);
        toast.error(tm("locationError"));
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  async function onSubmit(values: CollectionPointInput) {
    setSubmitting(true);
    const result = await createCollectionPoint(values);
    if (!result.ok) {
      toast.error(result.error);
      setSubmitting(false);
      return;
    }
    toast.success(t("success"));
    router.push("/ayuda/acopio");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="pais">{t("label.pais")} *</Label>
          <select id="pais" className={selectClass} {...register("pais")}>
            <option value="">{t("selectPais")}</option>
            {PAISES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <ErrorText msg={formState.errors.pais?.message} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ciudad">{t("label.ciudad")}</Label>
          <Input id="ciudad" className="h-11 text-base" {...register("ciudad")} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="nombre">{t("label.nombre")} *</Label>
        <Input
          id="nombre"
          className="h-11 text-base"
          placeholder={t("ph.nombre")}
          {...register("nombre")}
        />
        <ErrorText msg={formState.errors.nombre?.message} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="direccion">{t("label.direccion")}</Label>
        <Input
          id="direccion"
          className="h-11 text-base"
          {...register("direccion")}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-1"
          onClick={captureLocation}
          disabled={locating}
        >
          {locating ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <MapPin className="size-4" />
          )}
          {tm("useMyLocation")}
        </Button>
        {located ? (
          <span className="ml-2 text-sm text-success">
            {tm("locationSaved")}
          </span>
        ) : null}
      </div>

      {/* ¿Qué reciben? */}
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">{t("label.categorias")}</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {HELP_CATEGORIES.map((c) => (
            <label
              key={c}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-input px-3 py-2 text-sm has-checked:border-primary has-checked:bg-primary/10"
            >
              <input
                type="checkbox"
                value={c}
                className="size-4 accent-[var(--primary)]"
                {...register("categorias")}
              />
              <span aria-hidden>{helpCategoryEmoji[c]}</span>
              {th(`category.${c}`)}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="space-y-1.5">
        <Label htmlFor="horario">{t("label.horario")}</Label>
        <Input
          id="horario"
          className="h-11 text-base"
          placeholder={t("ph.horario")}
          {...register("horario")}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="instrucciones">{t("label.instrucciones")}</Label>
        <Textarea
          id="instrucciones"
          rows={3}
          placeholder={t("ph.instrucciones")}
          className="text-base"
          {...register("instrucciones")}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="contacto">{t("label.contacto")}</Label>
          <Input
            id="contacto"
            className="h-11 text-base"
            {...register("contacto")}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="url">{t("label.url")}</Label>
          <Input
            id="url"
            className="h-11 text-base"
            placeholder="instagram.com/…"
            {...register("url")}
          />
        </div>
      </div>

      <Button
        type="submit"
        size="lg"
        className="h-14 w-full text-base"
        disabled={submitting}
      >
        {submitting ? (
          <>
            <Loader2 className="size-5 animate-spin" />
            {t("submitting")}
          </>
        ) : (
          t("submit")
        )}
      </Button>
    </form>
  );
}
