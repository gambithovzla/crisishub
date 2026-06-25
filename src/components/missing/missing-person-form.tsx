"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Camera, Loader2, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createMissingPerson } from "@/app/desaparecidos/actions";
import { compressAndUploadPhoto } from "@/lib/upload";
import { ESTADOS_VENEZUELA } from "@/lib/venezuela";
import {
  CONTACT_METHODS,
  missingPersonSchema,
  type MissingPersonInput,
} from "@/lib/validations/missing-person";

const selectClass =
  "flex h-11 w-full rounded-lg border border-input bg-transparent px-3 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50";

export function MissingPersonForm() {
  const t = useTranslations("missing");
  const router = useRouter();

  const [foto, setFoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);

  const form = useForm<MissingPersonInput>({
    resolver: zodResolver(missingPersonSchema),
    defaultValues: {
      nombre: "",
      apellido: "",
      edad_aprox: "",
      ciudad: "",
      estado_region: "",
      descripcion: "",
      familiar_nombre: "",
      familiar_telefono: "",
      ultima_ubicacion_texto: "",
      ultima_lat: "",
      ultima_lng: "",
      ultimo_contacto_at: "",
      ultimo_contacto_medio: "",
      ultimo_contacto_actividad: "",
      foto_url: "",
    },
  });

  function onPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFoto(file);
    setPreview(URL.createObjectURL(file));
  }

  function captureLocation() {
    if (!("geolocation" in navigator)) {
      toast.error(t("locationUnsupported"));
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        form.setValue("ultima_lat", String(pos.coords.latitude));
        form.setValue("ultima_lng", String(pos.coords.longitude));
        setLocating(false);
        toast.success(t("locationCaptured"));
      },
      () => {
        setLocating(false);
        toast.error(t("locationError"));
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  async function onSubmit(values: MissingPersonInput) {
    setSubmitting(true);
    try {
      let foto_url = "";
      if (foto) {
        try {
          foto_url = await compressAndUploadPhoto(foto, "desaparecidos");
        } catch {
          toast.error(t("photoError"));
          setSubmitting(false);
          return;
        }
      }
      const result = await createMissingPerson({ ...values, foto_url });
      if (!result.ok) {
        toast.error(result.error);
        setSubmitting(false);
        return;
      }
      toast.success(t("success"));
      router.push(`/desaparecidos/${result.id}`);
    } catch {
      toast.error(t("error"));
      setSubmitting(false);
    }
  }

  const ultimaLat = useWatch({ control: form.control, name: "ultima_lat" });
  const hasLocation = !!ultimaLat;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
        {/* ───── Foto ───── */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">{t("section.photo")}</h2>
          <label
            htmlFor="foto"
            className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-input bg-muted/30 p-6 text-center text-muted-foreground transition-colors hover:border-primary"
          >
            {preview ? (
              <Image
                src={preview}
                alt=""
                width={160}
                height={160}
                unoptimized
                className="size-40 rounded-lg object-cover"
              />
            ) : (
              <Camera className="size-10" aria-hidden />
            )}
            <span className="font-medium text-foreground">
              {preview ? t("photoChange") : t("photoChoose")}
            </span>
            <span className="text-sm">{t("photoHint")}</span>
          </label>
          <input
            id="foto"
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={onPhotoChange}
          />
        </section>

        {/* ───── Datos de la persona ───── */}
        <section className="space-y-5">
          <h2 className="text-lg font-semibold">{t("section.person")}</h2>

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("label.nombre")} *</FormLabel>
                  <FormControl>
                    <Input className="h-11 text-base" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="apellido"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("label.apellido")} *</FormLabel>
                  <FormControl>
                    <Input className="h-11 text-base" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <FormField
              control={form.control}
              name="edad_aprox"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("label.edad")}</FormLabel>
                  <FormControl>
                    <Input
                      className="h-11 text-base"
                      inputMode="numeric"
                      placeholder="0-129"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="estado_region"
              render={({ field }) => (
                <FormItem className="sm:col-span-1">
                  <FormLabel>{t("label.estado")}</FormLabel>
                  <FormControl>
                    <select className={selectClass} {...field}>
                      <option value="">{t("selectEstado")}</option>
                      {ESTADOS_VENEZUELA.map((e) => (
                        <option key={e} value={e}>
                          {e}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ciudad"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("label.ciudad")}</FormLabel>
                  <FormControl>
                    <Input className="h-11 text-base" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="descripcion"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("label.descripcion")}</FormLabel>
                <FormControl>
                  <Textarea
                    rows={3}
                    placeholder={t("ph.descripcion")}
                    className="text-base"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        {/* ───── Último contacto ───── */}
        <section className="space-y-5 rounded-xl border border-warning/40 bg-warning/5 p-4 sm:p-5">
          <div>
            <h2 className="text-lg font-semibold">{t("section.lastContact")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("section.lastContactHint")}
            </p>
          </div>

          <FormField
            control={form.control}
            name="ultima_ubicacion_texto"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("label.ubicacion")}</FormLabel>
                <FormControl>
                  <Input
                    className="h-11 text-base"
                    placeholder={t("ph.ubicacion")}
                    {...field}
                  />
                </FormControl>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={captureLocation}
                    disabled={locating}
                  >
                    {locating ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <MapPin className="size-4" />
                    )}
                    {t("useMyLocation")}
                  </Button>
                  {hasLocation ? (
                    <span className="text-sm text-success">
                      {t("locationSaved")}
                    </span>
                  ) : null}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="ultimo_contacto_at"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("label.fecha")}</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      className="h-11 text-base"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ultimo_contacto_medio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("label.medio")}</FormLabel>
                  <FormControl>
                    <select className={selectClass} {...field}>
                      <option value="">{t("selectMedio")}</option>
                      {CONTACT_METHODS.map((m) => (
                        <option key={m} value={m}>
                          {t(`contactMethod.${m}`)}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="ultimo_contacto_actividad"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("label.actividad")}</FormLabel>
                <FormControl>
                  <Textarea
                    rows={2}
                    placeholder={t("ph.actividad")}
                    className="text-base"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        {/* ───── Datos del familiar ───── */}
        <section className="space-y-5">
          <div>
            <h2 className="text-lg font-semibold">{t("section.reporter")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("section.reporterHint")}
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="familiar_nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("label.familiarNombre")} *</FormLabel>
                  <FormControl>
                    <Input className="h-11 text-base" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="familiar_telefono"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("label.familiarTelefono")} *</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      inputMode="tel"
                      className="h-11 text-base"
                      placeholder="0412 1234567"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>{t("phonePublic")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </section>

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
    </Form>
  );
}
