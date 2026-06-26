"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2, MapPin } from "lucide-react";

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
import { createHelpRequest } from "@/app/ayuda/actions";
import { HELP_CATEGORIES, helpCategoryEmoji } from "@/lib/help";
import {
  helpRequestSchema,
  type HelpRequestInput,
} from "@/lib/validations/help";
import type { HelpMode } from "@/lib/supabase/types";

const selectClass =
  "flex h-11 w-full rounded-lg border border-input bg-background px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

export function HelpForm({ modo }: { modo: HelpMode }) {
  const t = useTranslations("help");
  const tm = useTranslations("missing");
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);

  const form = useForm<HelpRequestInput>({
    resolver: zodResolver(helpRequestSchema),
    defaultValues: {
      modo,
      categoria: "agua",
      descripcion: "",
      ubicacion_texto: "",
      lat: "",
      lng: "",
      contacto: "",
    },
  });

  function captureLocation() {
    if (!("geolocation" in navigator)) {
      toast.error(tm("locationUnsupported"));
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        form.setValue("lat", String(p.coords.latitude));
        form.setValue("lng", String(p.coords.longitude));
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

  async function onSubmit(values: HelpRequestInput) {
    setSubmitting(true);
    const result = await createHelpRequest(values);
    if (!result.ok) {
      toast.error(result.error);
      setSubmitting(false);
      return;
    }
    toast.success(t("success"));
    router.push(`/ayuda?modo=${modo}`);
  }

  const hasLocation = !!useWatch({ control: form.control, name: "lat" });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="categoria"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("label.categoria")}</FormLabel>
              <FormControl>
                <select className={selectClass} {...field}>
                  {HELP_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {helpCategoryEmoji[c]} {t(`category.${c}`)}
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
          name="descripcion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("label.descripcion")} *</FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  placeholder={
                    modo === "necesito"
                      ? t("ph.necesito")
                      : t("ph.ofrezco")
                  }
                  className="text-base"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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

        <FormField
          control={form.control}
          name="contacto"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("label.contacto")} *</FormLabel>
              <FormControl>
                <Input
                  className="h-11 text-base"
                  placeholder={t("ph.contacto")}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
