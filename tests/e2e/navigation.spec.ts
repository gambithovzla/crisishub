import { test, expect } from "@playwright/test";

const pages: { path: string; heading: RegExp }[] = [
  { path: "/buscar", heading: /Buscar/i },
  { path: "/desaparecidos", heading: /Desaparecidos/i },
  { path: "/mapa", heading: /Mapa/i },
  { path: "/hospitales", heading: /Hospital/i },
  { path: "/profesionales", heading: /profesional/i },
  { path: "/ayuda", heading: /Ayuda/i },
];

test.describe("Navegación de los módulos", () => {
  for (const p of pages) {
    test(`carga ${p.path} sin errores`, async ({ page }) => {
      const res = await page.goto(p.path);
      expect(res?.status(), `status de ${p.path}`).toBeLessThan(400);
      await expect(
        page.getByRole("heading", { name: p.heading }).first(),
      ).toBeVisible();
    });
  }
});
