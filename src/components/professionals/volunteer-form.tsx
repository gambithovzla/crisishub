"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FileCheck, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Captcha, CAPTCHA_ENABLED } from "@/components/captcha";
import { createVolunteer } from "@/app/profesionales/actions";
import { uploadCredential } from "@/lib/upload";
import { MODALIDADES, PROFESSIONS } from "@/lib/professions";
import {
  volunteerSchema,
  type VolunteerInput,
} from "@/lib/validations/volunteer";

const selectClass =
  "flex h-11 w-full rounded-lg border border-input bg-background px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

function ErrorText({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-sm font-medium text-destructive">{msg}</p>;
}

export function VolunteerForm() {
  const t = useTranslations("professionals");
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [credencial, setCredencial] = useState<File | null>(null);
  const [captchaToken, setCaptchaToken] = useState("");

  const form = useForm<VolunteerInput>({
    resolver: zodResolver(volunteerSchema),
    defaultValues: {
      nombre: "",
      profesion: "psicologo",
      especialidad: "",
      modalidades: [],
      zona: "",
      idiomas: "",
      bio: "",
      contacto: "",
      colegio_numero: "",
      credencial_path: "",
    },
  });
  const { register, handleSubmit, formState } = form;

  async function onSubmit(values: VolunteerInput) {
    if (!credencial) {
      toast.error(t("credentialRequired"));
      return;
    }
    setSubmitting(true);
    try {
      let credencial_path = "";
      try {
        credencial_path = await uploadCredential(credencial);
      } catch {
        toast.error(t("credentialError"));
        setSubmitting(false);
        return;
      }
      const result = await createVolunteer(
        { ...values, credencial_path },
        captchaToken,
      );
      if (!result.ok) {
        toast.error(result.error);
        setSubmitting(false);
        return;
      }
      toast.success(t("success"));
      router.push("/profesionales");
    } catch {
      toast.error(t("error"));
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="nombre">{t("label.name")} *</Label>
          <Input id="nombre" className="h-11 text-base" {...register("nombre")} />
          <ErrorText msg={formState.errors.nombre?.message} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="profesion">{t("label.profession")} *</Label>
          <select
            id="profesion"
            className={selectClass}
            {...register("profesion")}
          >
            {PROFESSIONS.map((p) => (
              <option key={p} value={p}>
                {t(`profession.${p}`)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="especialidad">{t("label.specialty")}</Label>
        <Input
          id="especialidad"
          className="h-11 text-base"
          placeholder={t("ph.specialty")}
          {...register("especialidad")}
        />
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">{t("label.modes")}</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {MODALIDADES.map((m) => (
            <label
              key={m}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-input px-3 py-2 text-sm has-checked:border-primary has-checked:bg-primary/10"
            >
              <input
                type="checkbox"
                value={m}
                className="size-4 accent-[var(--primary)]"
                {...register("modalidades")}
              />
              {t(`modalidad.${m}`)}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="zona">{t("label.zone")}</Label>
          <Input
            id="zona"
            className="h-11 text-base"
            placeholder={t("ph.zone")}
            {...register("zona")}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="idiomas">{t("label.languages")}</Label>
          <Input
            id="idiomas"
            className="h-11 text-base"
            {...register("idiomas")}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="bio">{t("label.bio")}</Label>
        <Textarea
          id="bio"
          rows={3}
          placeholder={t("ph.bio")}
          className="text-base"
          {...register("bio")}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="contacto">{t("label.contact")} *</Label>
          <Input
            id="contacto"
            className="h-11 text-base"
            placeholder={t("ph.contact")}
            {...register("contacto")}
          />
          <ErrorText msg={formState.errors.contacto?.message} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="colegio">{t("label.license")}</Label>
          <Input
            id="colegio"
            className="h-11 text-base"
            {...register("colegio_numero")}
          />
        </div>
      </div>

      {/* Credencial privada */}
      <div className="space-y-2 rounded-xl border border-dashed p-4">
        <Label htmlFor="credencial" className="font-medium">
          {t("label.credential")} *
        </Label>
        <p className="text-sm text-muted-foreground text-pretty">
          {t("credentialHint")}
        </p>
        <label
          htmlFor="credencial"
          className="flex cursor-pointer items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 text-sm hover:border-primary"
        >
          <FileCheck className="size-5 text-muted-foreground" />
          {credencial ? credencial.name : t("credentialChoose")}
        </label>
        <input
          id="credencial"
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={(e) => setCredencial(e.target.files?.[0] ?? null)}
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
  );
}
