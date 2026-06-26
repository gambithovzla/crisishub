import { cleanupFixtures } from "./fixtures";

/** Borra los datos de prueba al terminar la suite (deja la BD limpia). */
export default async function globalTeardown() {
  try {
    await cleanupFixtures();
    console.log("[e2e] fixtures borradas.");
  } catch (err) {
    console.warn(
      "[e2e] no se pudieron borrar las fixtures; revisa manualmente registros con la marca E2E_FIXTURE.",
      err instanceof Error ? err.message : err,
    );
  }
}
