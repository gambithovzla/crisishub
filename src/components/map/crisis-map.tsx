"use client";

import "leaflet/dist/leaflet.css";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import L from "leaflet";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMapEvents,
} from "react-leaflet";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Camera, Loader2, MapPin, Plus, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createMarker } from "@/app/mapa/actions";
import { compressAndUploadPhoto } from "@/lib/upload";
import { MARKER_TYPES, markerMeta } from "@/lib/markers";
import type { MapMarker, MarkerType } from "@/lib/supabase/types";

const selectClass =
  "flex h-11 w-full rounded-lg border border-input bg-background px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

function pinIcon(tipo: MarkerType, temp = false) {
  const { emoji, color } = markerMeta[tipo];
  return L.divIcon({
    className: "",
    html: `<div style="display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:9999px;background:white;border:3px solid ${temp ? "#111" : color};box-shadow:0 1px 5px rgba(0,0,0,.45);font-size:18px;${temp ? "animation:pulse 1s infinite" : ""}">${emoji}</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18],
  });
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-VE", { dateStyle: "medium" }).format(
    new Date(value),
  );
}

function ClickCapture({
  active,
  onPick,
}: {
  active: boolean;
  onPick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      if (active) onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

type Center = { lat: number; lng: number; zoom: number };

export default function CrisisMap({
  markers,
  center,
}: {
  markers: MapMarker[];
  center: Center;
}) {
  const t = useTranslations("map");
  const tm = useTranslations("missing");
  const router = useRouter();

  const [active, setActive] = useState<Set<MarkerType>>(
    () => new Set(MARKER_TYPES),
  );
  const [adding, setAdding] = useState(false);
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);

  // Campos del formulario de alta
  const [tipo, setTipo] = useState<MarkerType>("hospital");
  const [descripcion, setDescripcion] = useState("");
  const [usuario, setUsuario] = useState("");
  const [foto, setFoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Búsqueda de direcciones (geocoding con Nominatim / OpenStreetMap)
  const mapRef = useRef<L.Map | null>(null);
  const [geoQuery, setGeoQuery] = useState("");
  const [geoResults, setGeoResults] = useState<
    { display: string; lat: number; lng: number }[]
  >([]);
  const [geoLoading, setGeoLoading] = useState(false);

  async function searchAddress(e?: React.FormEvent) {
    e?.preventDefault();
    const q = geoQuery.trim();
    if (!q) return;
    setGeoLoading(true);
    setGeoResults([]);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&accept-language=es&q=${encodeURIComponent(q)}`;
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      const data = (await res.json()) as {
        display_name: string;
        lat: string;
        lon: string;
      }[];
      const results = data.map((d) => ({
        display: d.display_name,
        lat: Number(d.lat),
        lng: Number(d.lon),
      }));
      if (results.length === 0) toast.message(t("noResults"));
      setGeoResults(results);
    } catch {
      toast.error(t("searchError"));
    } finally {
      setGeoLoading(false);
    }
  }

  // Vuela al punto elegido y prepara el marcador ahí (abre el formulario).
  function goToResult(r: { display: string; lat: number; lng: number }) {
    mapRef.current?.flyTo([r.lat, r.lng], 17, { duration: 1.2 });
    setPos({ lat: r.lat, lng: r.lng });
    setAdding(false);
    setGeoResults([]);
    setGeoQuery(r.display);
  }

  const visibleMarkers = useMemo(
    () => markers.filter((m) => active.has(m.tipo)),
    [markers, active],
  );

  function toggleType(tp: MarkerType) {
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(tp)) next.delete(tp);
      else next.add(tp);
      return next;
    });
  }

  function resetForm() {
    setPos(null);
    setAdding(false);
    setDescripcion("");
    setUsuario("");
    setFoto(null);
    setPreview(null);
    setTipo("hospital");
  }

  function useMyLocation() {
    if (!("geolocation" in navigator)) {
      toast.error(tm("locationUnsupported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => setPos({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => toast.error(tm("locationError")),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  async function submit() {
    if (!pos) return;
    setSubmitting(true);
    try {
      let foto_url = "";
      if (foto) {
        try {
          foto_url = await compressAndUploadPhoto(foto, "marcadores");
        } catch {
          toast.error(tm("photoError"));
          setSubmitting(false);
          return;
        }
      }
      const result = await createMarker({
        tipo,
        descripcion,
        usuario,
        lat: String(pos.lat),
        lng: String(pos.lng),
        foto_url,
      });
      if (!result.ok) {
        toast.error(result.error);
        setSubmitting(false);
        return;
      }
      toast.success(t("success"));
      resetForm();
      router.refresh();
    } catch {
      toast.error(tm("error"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative">
      {/* Buscar por dirección (estilo Uber/Cabify): el mapa salta al punto */}
      <div className="pb-3">
        <form onSubmit={searchAddress} className="flex gap-2">
          <Input
            value={geoQuery}
            onChange={(e) => setGeoQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchTitle")}
            className="h-11 text-base"
          />
          <Button type="submit" className="h-11 shrink-0" disabled={geoLoading}>
            {geoLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Search className="size-4" />
            )}
            <span className="hidden sm:inline">{t("searchButton")}</span>
          </Button>
        </form>
        {geoResults.length > 0 ? (
          <ul className="mt-2 divide-y overflow-hidden rounded-lg border bg-card">
            {geoResults.map((r, i) => (
              <li key={`${r.lat}-${r.lng}-${i}`}>
                <button
                  type="button"
                  onClick={() => goToResult(r)}
                  className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
                >
                  <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  {r.display}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1.5 text-xs text-muted-foreground">{t("searchHint")}</p>
        )}
      </div>

      {/* Filtros por tipo */}
      <div className="flex flex-wrap gap-2 pb-3">
        {MARKER_TYPES.map((tp) => {
          const on = active.has(tp);
          return (
            <button
              key={tp}
              type="button"
              onClick={() => toggleType(tp)}
              aria-pressed={on}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                on
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-input text-muted-foreground opacity-60"
              }`}
            >
              <span aria-hidden>{markerMeta[tp].emoji}</span>
              {t(`type.${tp}`)}
            </button>
          );
        })}
      </div>

      {/* Mapa */}
      <div className="relative h-[65vh] w-full overflow-hidden rounded-xl border">
        <MapContainer
          ref={mapRef}
          center={[center.lat, center.lng]}
          zoom={center.zoom}
          scrollWheelZoom
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickCapture
            active={adding}
            onPick={(lat, lng) => setPos({ lat, lng })}
          />

          {visibleMarkers.map((m) => (
            <Marker key={m.id} position={[m.lat, m.lng]} icon={pinIcon(m.tipo)}>
              <Popup>
                <div className="space-y-1">
                  <p className="font-semibold">
                    {markerMeta[m.tipo].emoji} {t(`type.${m.tipo}`)}
                  </p>
                  {m.descripcion ? <p>{m.descripcion}</p> : null}
                  {m.foto_url ? (
                    <Image
                      src={m.foto_url}
                      alt=""
                      width={200}
                      height={120}
                      className="rounded"
                    />
                  ) : null}
                  <p className="text-xs text-muted-foreground">
                    {formatDate(m.created_at)} ·{" "}
                    {m.usuario
                      ? t("popup.addedBy", { user: m.usuario })
                      : t("popup.anon")}
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}

          {pos ? (
            <Marker position={[pos.lat, pos.lng]} icon={pinIcon(tipo, true)} />
          ) : null}
        </MapContainer>

        {/* Banner de modo "añadir" */}
        {adding && !pos ? (
          <div className="pointer-events-none absolute inset-x-0 top-2 z-[1000] mx-auto w-fit rounded-full bg-foreground/90 px-4 py-2 text-sm text-background shadow">
            {t("addHint")}
          </div>
        ) : null}

        {/* Botón flotante añadir / cancelar */}
        {!pos ? (
          <Button
            type="button"
            onClick={() => (adding ? resetForm() : setAdding(true))}
            className="absolute right-4 bottom-4 z-[1000] h-12 shadow-lg"
          >
            {adding ? <X className="size-5" /> : <Plus className="size-5" />}
            {adding ? t("cancel") : t("add")}
          </Button>
        ) : null}
      </div>

      {/* Formulario de alta (panel inferior) */}
      {pos ? (
        <div className="mt-4 space-y-4 rounded-xl border bg-card p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t("form.title")}</h2>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={resetForm}
              aria-label={t("cancel")}
            >
              <X className="size-5" />
            </Button>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tipo">{t("form.tipo")}</Label>
            <select
              id="tipo"
              value={tipo}
              onChange={(e) => setTipo(e.target.value as MarkerType)}
              className={selectClass}
            >
              {MARKER_TYPES.map((tp) => (
                <option key={tp} value={tp}>
                  {markerMeta[tp].emoji} {t(`type.${tp}`)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="descripcion">{t("form.descripcion")}</Label>
            <Textarea
              id="descripcion"
              rows={2}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder={t("form.descripcionPh")}
              className="text-base"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="usuario">{t("form.usuario")}</Label>
              <Input
                id="usuario"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                className="h-11 text-base"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="marker-foto">{t("form.foto")}</Label>
              <label
                htmlFor="marker-foto"
                className="flex h-11 cursor-pointer items-center gap-2 rounded-lg border border-dashed border-input px-3 text-sm text-muted-foreground hover:border-primary"
              >
                {preview ? (
                  <Image
                    src={preview}
                    alt=""
                    width={28}
                    height={28}
                    unoptimized
                    className="size-7 rounded object-cover"
                  />
                ) : (
                  <Camera className="size-5" />
                )}
                {preview ? tm("photoChange") : t("form.fotoAdd")}
              </label>
              <input
                id="marker-foto"
                type="file"
                accept="image/*"
                capture="environment"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  setFoto(f);
                  setPreview(URL.createObjectURL(f));
                }}
              />
            </div>
          </div>

          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="size-4" />
            {pos.lat.toFixed(5)}, {pos.lng.toFixed(5)}
          </p>

          <Button
            type="button"
            size="lg"
            className="h-12 w-full text-base"
            onClick={submit}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="size-5 animate-spin" />
                {t("form.submitting")}
              </>
            ) : (
              t("form.submit")
            )}
          </Button>
        </div>
      ) : adding ? (
        <Button
          type="button"
          variant="outline"
          className="mt-3"
          onClick={useMyLocation}
        >
          <MapPin className="size-4" />
          {tm("useMyLocation")}
        </Button>
      ) : null}
    </div>
  );
}
