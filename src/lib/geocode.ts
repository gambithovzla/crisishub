export type GeoResult = { display: string; lat: number; lng: number };

/**
 * Geocodifica una dirección con Nominatim (OpenStreetMap). Gratis, sin API key.
 * Devuelve hasta `limit` resultados con lat/lng.
 */
export async function geocodeAddress(
  query: string,
  limit = 5,
): Promise<GeoResult[]> {
  const q = query.trim();
  if (!q) return [];
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=${limit}&accept-language=es&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error("geocode failed");
  const data = (await res.json()) as {
    display_name: string;
    lat: string;
    lon: string;
  }[];
  return data.map((d) => ({
    display: d.display_name,
    lat: Number(d.lat),
    lng: Number(d.lon),
  }));
}
