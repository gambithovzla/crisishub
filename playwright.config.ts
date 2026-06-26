import path from "node:path";

import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, ".env.local") });

/**
 * Tests E2E de CrisisHub.
 * Por defecto corren contra el servidor de desarrollo local (localhost:3000).
 * Puedes apuntar a otro entorno con: BASE_URL=https://www.vzla.lat npx playwright test
 *
 * Nota: los tests NO crean datos (la BD local apunta al Supabase real), por eso
 * los flujos que dependen de datos (compartir, cronología, duplicados) son
 * condicionales y se omiten si no hay fichas.
 */
const baseURL = process.env.BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./tests/e2e",
  globalSetup: "./tests/global-setup.ts",
  globalTeardown: "./tests/global-teardown.ts",
  // Sin paralelismo agresivo: `next dev` compila cada ruta bajo demanda y la
  // primera carga es lenta. workers=1 + timeouts holgados evita falsos fallos.
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 10_000 },
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    locale: "es-VE",
    navigationTimeout: 60_000,
    actionTimeout: 20_000,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "mobile",
      use: { ...devices["Pixel 7"] },
    },
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // Reusa el `npm run dev` que ya tengas abierto; si no, lo arranca.
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: "npm run dev",
        url: "http://localhost:3000",
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
