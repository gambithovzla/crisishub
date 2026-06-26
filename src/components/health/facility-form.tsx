"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2, MapPin, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createHealthFacility } from "@/app/hospitales/actions";
import { geocodeAddress } from "@/lib/geocode";
import { FACILITY_TYPES } from "@/lib/health";
import { ESTADOS_VENEZUELA } from "@/lib/venezuela";
import {
  healthFacilitySchema,
  type HealthFacilityInput,
} from "@/lib/validations/health-facility";

const selectClass =
  "flex h-11 w-full rounded-lg border border-input bg-background px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

function ErrorText({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-sm font-medium text-destructive">{msg}</p>;
}

export function FacilityForm() {
  const t = useTranslations("health");
  const tm = useTranslations("missing");
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);
  const [located, setLocated] = useState(false);

  const form = useForm<HealthFacilityInput>({
    resolver: zodResolver(healthFacilitySchema),
    defaultValues: {
      nombre: "",
      tipo: "hospital",
      estado: "",
      ciudad: "",
      direccion: "",
      lat: "",
      lng: "",
      telefono: "",
      capacidad: "",
      url: "",
    },
  });
  const { register, handleSubmit, setValue, getValues, formState } = form;
  const [geocoding, setGeocoding] = useState(false);

  // Geocodifica la dirección escrita (estilo Uber) y fija las coordenadas.
  async function locateByAddress() {
    const { direccion, ciudad, estado } = getValues();
    const query = [direccion, ciudad, estado, "Venezuela"]
      .filter(Boolean)
      .join(", ");
    if (!direccion.trim() && !ciudad.trim()) {
      toast.error(t("geocodeEmpty"));
      return;
    }
    setGeocoding(true);
    try {
      const results = await geocodeAddress(query, 1);
      if (results.length === 0) {
        toast.error(t("geocodeNotFound"));
        return;
      }
      setValue("lat", String(results[0].lat));
      setValue("lng", String(results[0].lng));
      setLocated(true);
      toast.success(t("geocodeOk"));
    } catch {
      toast.error(t("geocodeError"));
    } finally {
      setGeocoding(false);
    }
  }

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

  async function onSubmit(values: HealthFacilityInput) {
    setSubmitting(true);
    const result = await createHealthFacility(values);
    if (!result.ok) {
      toast.error(result.error);
      setSubmitting(false);
      return;
    }
    toast.success(t("facilitySuccess"));
    router.push("/hospitales");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-1.5">
        <Label htmlFor="nombre">{t("label.facilityName")} *</Label>
        <Input
          id="nombre"
          className="h-11 text-base"
          placeholder={t("ph.facilityName")}
          {...register("nombre")}
        />
        <ErrorText msg={formState.errors.nombre?.message} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="tipo">{t("label.type")} *</Label>
          <select id="tipo" className={selectClass} {...register("tipo")}>
            {FACILITY_TYPES.map((ft) => (
              <option key={ft} value={ft}>
                {t(`facilityType.${ft}`)}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="estado">{t("label.estado")}</Label>
          <select id="estado" className={selectClass} {...register("estado")}>
            <option value="">{t("selectEstado")}</option>
            {ESTADOS_VENEZUELA.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="ciudad">{t("label.ciudad")}</Label>
        <Input id="ciudad" className="h-11 text-base" {...register("ciudad")} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="direccion">{t("label.direccion")}</Label>
        <Input
          id="direccion"
          className="h-11 text-base"
          {...register("direccion")}
        />
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={locateByAddress}
            disabled={geocoding}
          >
            {geocoding ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Search className="size-4" />
            )}
            {t("geocodeAddress")}
          </Button>
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
          {located ? (
            <span className="text-sm text-success">{tm("locationSaved")}</span>
          ) : null}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="capacidad">{t("label.capacity")}</Label>
        <Textarea
          id="capacidad"
          rows={3}
          placeholder={t("ph.capacity")}
          className="text-base"
          {...register("capacidad")}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="telefono">{t("label.phone")}</Label>
          <Input
            id="telefono"
            className="h-11 text-base"
            {...register("telefono")}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="url">{t("label.url")}</Label>
          <Input
            id="url"
            className="h-11 text-base"
            placeholder="hospital.gob.ve"
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
          t("facilitySubmit")
        )}
      </Button>
    </form>
  );
}
