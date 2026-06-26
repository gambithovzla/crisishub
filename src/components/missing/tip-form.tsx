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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createTip } from "@/app/desaparecidos/actions";
import { Captcha, CAPTCHA_ENABLED } from "@/components/captcha";
import { compressAndUploadPhoto } from "@/lib/upload";
import { tipSchema, type TipInput } from "@/lib/validations/tip";

export function TipForm({ personId }: { personId: number }) {
  const t = useTranslations("tip");
  const tm = useTranslations("missing");
  const router = useRouter();

  const [foto, setFoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");

  const form = useForm<TipInput>({
    resolver: zodResolver(tipSchema),
    defaultValues: {
      informacion: "",
      nombre: "",
      telefono: "",
      ubicacion_texto: "",
      lat: "",
      lng: "",
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
      toast.error(tm("locationUnsupported"));
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        form.setValue("lat", String(pos.coords.latitude));
        form.setValue("lng", String(pos.coords.longitude));
        setLocating(false);
        toast.success(tm("locationCaptured"));
      },
      () => {
        setLocating(false);
        toast.error(tm("locationError"));
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  async function onSubmit(values: TipInput) {
    setSubmitting(true);
    try {
      let foto_url = "";
      if (foto) {
        try {
          foto_url = await compressAndUploadPhoto(foto, "tips");
        } catch {
          toast.error(tm("photoError"));
          setSubmitting(false);
          return;
        }
      }
      const result = await createTip(
        personId,
        { ...values, foto_url },
        captchaToken,
      );
      if (!result.ok) {
        toast.error(result.error);
        setSubmitting(false);
        return;
      }
      toast.success(t("success"));
      router.push(`/desaparecidos/${personId}`);
    } catch {
      toast.error(tm("error"));
      setSubmitting(false);
    }
  }

  const hasLocation = !!useWatch({ control: form.control, name: "lat" });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="informacion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("label.info")} *</FormLabel>
              <FormControl>
                <Textarea
                  rows={4}
                  placeholder={t("ph.info")}
                  className="text-base"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Foto opcional */}
        <div className="space-y-2">
          <label
            htmlFor="tip-foto"
            className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-input bg-muted/30 p-4 text-muted-foreground transition-colors hover:border-primary"
          >
            {preview ? (
              <Image
                src={preview}
                alt=""
                width={64}
                height={64}
                unoptimized
                className="size-16 rounded-lg object-cover"
              />
            ) : (
              <Camera className="size-7" aria-hidden />
            )}
            <span className="font-medium text-foreground">
              {preview ? tm("photoChange") : t("photoOptional")}
            </span>
          </label>
          <input
            id="tip-foto"
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={onPhotoChange}
          />
        </div>

        <FormField
          control={form.control}
          name="ubicacion_texto"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("label.ubicacion")}</FormLabel>
              <FormControl>
                <Input
                  className="h-11 text-base"
                  placeholder={tm("ph.ubicacion")}
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
                  {tm("useMyLocation")}
                </Button>
                {hasLocation ? (
                  <span className="text-sm text-success">
                    {tm("locationSaved")}
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
            name="nombre"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("label.nombre")}</FormLabel>
                <FormControl>
                  <Input className="h-11 text-base" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="telefono"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("label.telefono")}</FormLabel>
                <FormControl>
                  <Input
                    type="tel"
                    inputMode="tel"
                    className="h-11 text-base"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Captcha onToken={setCaptchaToken} />
        <Button
          type="submit"
          size="lg"
          className="h-14 w-full text-base"
          disabled={submitting || (CAPTCHA_ENABLED && !captchaToken)}
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
