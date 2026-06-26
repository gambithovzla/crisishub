import { test, expect } from "@playwright/test";

import { readFixtures } from "../fixtures";

test.describe("Mapa", () => {
  test("el mapa de Leaflet se renderiza", async ({ page }) => {
    await page.goto("/mapa");
    // Leaflet monta un contenedor con esta clase cuando carga correctamente.
    await expect(page.locator(".leaflet-container")).toBeVisible({
      timeout: 15_000,
    });
  });

  test("capa de últimas ubicaciones (requiere E2E_SEED_ACTIVE=1)", async ({
    page,
  }) => {
    const f = readFixtures();
    test.skip(
      !f?.activeName,
      "Sin seed en el evento activo (E2E_SEED_ACTIVE=1).",
    );

    await page.goto("/mapa");
    // El chip lo renderiza el mapa (carga diferida ssr:false); esperamos a que monte.
    const chip = page.getByRole("button", { name: /Últimas ubicaciones/i });
    await expect(chip).toBeVisible({ timeout: 25_000 });
  });
});

test.describe("Ficha de desaparecido", () => {
  test("compartir y cronología en la ficha de prueba", async ({ page }) => {
    const f = readFixtures();
    test.skip(!f?.fichaId, "No hay ficha de prueba (fixtures no creadas).");

    await page.goto(`/desaparecidos/${f!.fichaId}`);
    await expect(page).toHaveURL(/\/desaparecidos\/\d+$/);

    // Botones de compartir (hay otro WhatsApp para el familiar; tomamos el de compartir).
    await expect(page.getByRole("button", { name: "Compartir" })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "WhatsApp" }).first(),
    ).toBeVisible();

    // Cronología del caso (la fixture trae último contacto + reporte + pista).
    await expect(
      page.getByRole("heading", { name: "Cronología del caso" }),
    ).toBeVisible();
  });
});

test.describe("Detección de duplicados (requiere E2E_SEED_ACTIVE=1)", () => {
  test("avisa de un reporte parecido al escribir el mismo nombre", async ({
    page,
  }) => {
    const f = readFixtures();
    test.skip(
      !f?.activeName,
      "Sin seed en el evento activo (E2E_SEED_ACTIVE=1).",
    );

    await page.goto("/desaparecidos/nuevo");
    await page.getByLabel(/^Nombre \*/).fill(f!.activeName!.nombre);
    const apellido = page.getByLabel(/^Apellido \*/);
    await apellido.fill(f!.activeName!.apellido);
    await apellido.blur();

    await expect(
      page.getByRole("heading", { name: "¿Es alguna de estas personas?" }),
    ).toBeVisible({ timeout: 15_000 });
  });
});
