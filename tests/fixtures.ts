import fs from "node:fs";
import path from "node:path";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Carga las credenciales reales desde .env.local (mismo Supabase que la app).
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

/** Marca para identificar y limpiar SOLO los datos de prueba. */
export const FIXTURE_MARK = "E2E_FIXTURE";
const TEST_EVENT_SLUG = "e2e-test-event";
export const FIXTURES_FILE = path.resolve(process.cwd(), "tests/.fixtures.json");

export type Fixtures = {
  /** Ficha (evento inactivo) para probar compartir + cronología. */
  fichaId: number | null;
  /** Persona en el evento ACTIVO (solo si E2E_SEED_ACTIVE=1) para duplicados/mapa. */
  activeName: { nombre: string; apellido: string } | null;
};

function admin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local",
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Crea (o reutiliza) un evento de prueba INACTIVO, invisible al público. */
async function ensureTestEvent(db: SupabaseClient): Promise<number> {
  const existing = await db
    .from("events")
    .select("id")
    .eq("slug", TEST_EVENT_SLUG)
    .maybeSingle();
  if (existing.data?.id) return existing.data.id as number;

  const inserted = await db
    .from("events")
    .insert({
      slug: TEST_EVENT_SLUG,
      nombre: "E2E TEST EVENT (no usar)",
      tipo: "otro",
      activo: false,
      center_lat: 10.4806,
      center_lng: -66.9036,
      center_zoom: 7,
    })
    .select("id")
    .single();
  if (inserted.error) throw inserted.error;
  return inserted.data.id as number;
}

async function getActiveEventId(db: SupabaseClient): Promise<number | null> {
  const { data } = await db
    .from("events")
    .select("id")
    .eq("activo", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.id as number) ?? null;
}

/**
 * Inserta datos de prueba. Por defecto solo en el evento de prueba inactivo
 * (invisible al público). Con E2E_SEED_ACTIVE=1 añade además una persona en el
 * evento activo para poder probar duplicados y la capa de personas del mapa.
 */
export async function seedFixtures(): Promise<Fixtures> {
  const db = admin();
  const eventId = await ensureTestEvent(db);

  // Persona con última ubicación + una pista (para la cronología).
  const person = await db
    .from("missing_persons")
    .insert({
      event_id: eventId,
      nombre: "Mariaprueba",
      apellido: "Fixturez",
      edad_aprox: 30,
      ciudad: "Caracas",
      estado_region: "Distrito Capital",
      descripcion: `${FIXTURE_MARK} ficha de prueba automatizada`,
      documento: "900000001",
      ultima_lat: 10.49,
      ultima_lng: -66.88,
      ultima_ubicacion_texto: "Av. de prueba, Caracas",
      ultimo_contacto_at: new Date(Date.now() - 86_400_000).toISOString(),
      ultimo_contacto_medio: "llamada",
      familiar_nombre: "Familiar Prueba",
      familiar_telefono: "04120000000",
    })
    .select("id")
    .single();
  if (person.error) throw person.error;
  const fichaId = person.data.id as number;

  await db.from("tips").insert({
    missing_person_id: fichaId,
    informacion: `${FIXTURE_MARK} pista de prueba para la cronología`,
  });

  let activeName: Fixtures["activeName"] = null;
  if (process.env.E2E_SEED_ACTIVE === "1") {
    const activeId = await getActiveEventId(db);
    if (activeId) {
      activeName = { nombre: "Pedrotest", apellido: "Duplicadez" };
      await db.from("missing_persons").insert({
        event_id: activeId,
        nombre: activeName.nombre,
        apellido: activeName.apellido,
        descripcion: `${FIXTURE_MARK} duplicado/mapa de prueba`,
        documento: "900000002",
        ultima_lat: 10.5,
        ultima_lng: -66.9,
        ultima_ubicacion_texto: "Punto de prueba",
        familiar_nombre: "Familiar Prueba",
        familiar_telefono: "04120000001",
      });
    }
  }

  const fixtures: Fixtures = { fichaId, activeName };
  fs.writeFileSync(FIXTURES_FILE, JSON.stringify(fixtures, null, 2));
  return fixtures;
}

/** Borra TODOS los datos marcados como prueba (en cualquier evento). */
export async function cleanupFixtures(): Promise<void> {
  const db = admin();
  // Las pistas se borran en cascada al borrar la persona.
  await db
    .from("missing_persons")
    .delete()
    .ilike("descripcion", `%${FIXTURE_MARK}%`);
  if (fs.existsSync(FIXTURES_FILE)) fs.rmSync(FIXTURES_FILE);
}

export function readFixtures(): Fixtures | null {
  try {
    return JSON.parse(fs.readFileSync(FIXTURES_FILE, "utf8")) as Fixtures;
  } catch {
    return null;
  }
}
