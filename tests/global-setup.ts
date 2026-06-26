import { seedFixtures } from "./fixtures";

/** Crea datos de prueba antes de la suite (se limpian en el teardown). */
export default async function globalSetup() {
  try {
    const f = await seedFixtures();
    console.log(
      `[e2e] fixtures listas: ficha=${f.fichaId}` +
        (f.activeName ? ` activo=${f.activeName.nombre}` : " (sin seed activo)"),
    );
  } catch (err) {
    console.warn(
      "[e2e] no se pudieron crear fixtures (¿faltan claves en .env.local?). " +
        "Los tests que requieren datos se omitirán.",
      err instanceof Error ? err.message : err,
    );
  }
}
