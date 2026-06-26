"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createPatientRecord } from "@/app/hospitales/actions";
import { DOCUMENT_TYPES, PATIENT_STATUSES } from "@/lib/health";
import {
  patientRecordSchema,
  type PatientRecordInput,
} from "@/lib/validations/patient-record";

export type FacilityOption = {
  id: number;
  nombre: string;
  estado: string | null;
};

const selectClass =
  "flex h-11 w-full rounded-lg border border-input bg-background px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

function ErrorText({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-sm font-medium text-destructive">{msg}</p>;
}

const OTHER = "__otro__";

export function PatientForm({ facilities }: { facilities: FacilityOption[] }) {
  const t = useTranslations("health");
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [facilityChoice, setFacilityChoice] = useState("");

  const form = useForm<PatientRecordInput>({
    resolver: zodResolver(patientRecordSchema),
    defaultValues: {
      nombre: "",
      facilityId: "",
      facilityNombre: "",
      documentoTipo: "cedula_v",
      documento: "",
      edad: "",
      sexo: "",
      estado: "ingresado",
      notas: "",
      reportanteNombre: "",
      reportanteContacto: "",
    },
  });
  const { register, handleSubmit, setValue, watch, formState } = form;

  const documentoTipo = watch("documentoTipo");

  // Agrupar centros por estado para el select.
  const groups = new Map<string, FacilityOption[]>();
  for (const f of facilities) {
    const key = f.estado ?? "—";
    const arr = groups.get(key) ?? [];
    arr.push(f);
    groups.set(key, arr);
  }

  function onFacilityChange(value: string) {
    setFacilityChoice(value);
    if (value === OTHER || value === "") {
      setValue("facilityId", "");
    } else {
      setValue("facilityId", value);
      setValue("facilityNombre", "");
    }
  }

  async function onSubmit(values: PatientRecordInput) {
    setSubmitting(true);
    const result = await createPatientRecord(values);
    if (!result.ok) {
      toast.error(result.error);
      setSubmitting(false);
      return;
    }
    toast.success(t("patientSuccess"));
    router.push("/hospitales");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Centro de salud */}
      <div className="space-y-1.5">
        <Label htmlFor="facility">{t("label.facility")} *</Label>
        <select
          id="facility"
          className={selectClass}
          value={facilityChoice}
          onChange={(e) => onFacilityChange(e.target.value)}
        >
          <option value="">{t("selectFacility")}</option>
          {[...groups.entries()].map(([estado, list]) => (
            <optgroup key={estado} label={estado}>
              {list.map((f) => (
                <option key={f.id} value={String(f.id)}>
                  {f.nombre}
                </option>
              ))}
            </optgroup>
          ))}
          <option value={OTHER}>{t("facilityOther")}</option>
        </select>
        {facilityChoice === OTHER ? (
          <Input
            className="mt-2 h-11 text-base"
            placeholder={t("ph.facilityOther")}
            {...register("facilityNombre")}
          />
        ) : null}
        <ErrorText msg={formState.errors.facilityNombre?.message} />
      </div>

      {/* Datos del paciente */}
      <div className="space-y-1.5">
        <Label htmlFor="nombre">{t("label.patientName")} *</Label>
        <Input
          id="nombre"
          className="h-11 text-base"
          placeholder={t("ph.patientName")}
          {...register("nombre")}
        />
        <ErrorText msg={formState.errors.nombre?.message} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="documentoTipo">{t("label.docType")}</Label>
          <select
            id="documentoTipo"
            className={selectClass}
            {...register("documentoTipo")}
          >
            {DOCUMENT_TYPES.map((d) => (
              <option key={d} value={d}>
                {t(`docType.${d}`)}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="documento">{t("label.docNumber")}</Label>
          <Input
            id="documento"
            inputMode="numeric"
            disabled={documentoTipo === "sin_documento"}
            className="h-11 text-base"
            placeholder={t("ph.docNumber")}
            {...register("documento")}
          />
          <ErrorText msg={formState.errors.documento?.message} />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="edad">{t("label.age")}</Label>
          <Input
            id="edad"
            inputMode="numeric"
            className="h-11 text-base"
            {...register("edad")}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sexo">{t("label.sex")}</Label>
          <select id="sexo" className={selectClass} {...register("sexo")}>
            <option value="">{t("sex.unknown")}</option>
            <option value="M">{t("sex.M")}</option>
            <option value="F">{t("sex.F")}</option>
            <option value="otro">{t("sex.otro")}</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="estado">{t("label.patientStatus")} *</Label>
          <select id="estado" className={selectClass} {...register("estado")}>
            {PATIENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {t(`patientStatus.${s}`)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notas">{t("label.notes")}</Label>
        <Textarea
          id="notas"
          rows={2}
          placeholder={t("ph.notes")}
          className="text-base"
          {...register("notas")}
        />
        <p className="text-xs text-muted-foreground">{t("notesHint")}</p>
      </div>

      {/* Contacto del reportante (privado) */}
      <fieldset className="space-y-4 rounded-xl border border-dashed p-4">
        <legend className="px-1 text-sm font-medium">
          {t("reporterLegend")}
        </legend>
        <p className="text-xs text-muted-foreground">{t("reporterHint")}</p>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="reportanteNombre">{t("label.reporterName")}</Label>
            <Input
              id="reportanteNombre"
              className="h-11 text-base"
              {...register("reportanteNombre")}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reportanteContacto">
              {t("label.reporterContact")}
            </Label>
            <Input
              id="reportanteContacto"
              className="h-11 text-base"
              {...register("reportanteContacto")}
            />
          </div>
        </div>
      </fieldset>

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
          t("patientSubmit")
        )}
      </Button>
    </form>
  );
}
