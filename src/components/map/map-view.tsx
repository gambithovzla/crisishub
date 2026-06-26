"use client";

import dynamic from "next/dynamic";

import { Skeleton } from "@/components/ui/skeleton";
import type { MapMarker, MissingLocation } from "@/lib/supabase/types";

// Carga diferida sin SSR: Leaflet necesita `window`, y así no penaliza el 2G.
const CrisisMap = dynamic(() => import("./crisis-map"), {
  ssr: false,
  loading: () => <Skeleton className="h-[65vh] w-full rounded-xl" />,
});

export function MapView(props: {
  markers: MapMarker[];
  people: MissingLocation[];
  center: { lat: number; lng: number; zoom: number };
}) {
  return <CrisisMap {...props} />;
}
