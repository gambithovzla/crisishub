import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { MapView } from "@/components/map/map-view";
import { getActiveEvent } from "@/lib/events";
import { createClient } from "@/lib/supabase/server";
import type { MissingLocation } from "@/lib/supabase/types";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("map") };
}

const DEFAULT_CENTER = { lat: 10.4806, lng: -66.9036, zoom: 7 };

export default async function MapPage() {
  const t = await getTranslations("map");
  const tNav = await getTranslations("nav");

  const event = await getActiveEvent();
  const supabase = await createClient();
  const [markersRes, peopleRes] = event
    ? await Promise.all([
        supabase
          .from("map_markers")
          .select("*")
          .eq("event_id", event.id)
          .order("created_at", { ascending: false })
          .limit(500),
        supabase
          .from("missing_persons")
          .select(
            "id,nombre,apellido,foto_url,estado,ultima_ubicacion_texto,ultima_lat,ultima_lng",
          )
          .eq("event_id", event.id)
          .eq("moderation", "visible")
          .not("ultima_lat", "is", null)
          .not("ultima_lng", "is", null)
          .limit(500),
      ])
    : [{ data: [] }, { data: [] }];
  const markers = markersRes.data ?? [];
  const people = (peopleRes.data ?? []) as MissingLocation[];

  const center =
    event && event.center_lat != null && event.center_lng != null
      ? {
          lat: event.center_lat,
          lng: event.center_lng,
          zoom: event.center_zoom,
        }
      : DEFAULT_CENTER;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        {tNav("map")}
      </h1>
      <p className="mt-1 text-muted-foreground">{t("intro")}</p>
      <div className="mt-6">
        <MapView markers={markers} people={people} center={center} />
      </div>
    </div>
  );
}
