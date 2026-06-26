import { test, expect } from "@playwright/test";

test.describe("Home", () => {
  test("muestra el título y las tres acciones grandes", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: "Toda la ayuda, en un solo lugar" }),
    ).toBeVisible();

    // Las tres acciones gigantes (son enlaces).
    await expect(
      page.getByRole("link", { name: "Reportar a una persona desaparecida" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Buscar a una persona" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Pedir u ofrecer ayuda" }),
    ).toBeVisible();

    // Vista previa del mapa y directorio de servicios.
    await expect(page.getByText("Mapa de la emergencia")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "¿Qué necesitas hacer?" }),
    ).toBeVisible();
  });

  test("el texto de las acciones no se desborda del botón", async ({
    page,
  }) => {
    await page.goto("/");

    const labels = [
      "Reportar a una persona desaparecida",
      "Buscar a una persona",
      "Pedir u ofrecer ayuda",
    ];

    for (const label of labels) {
      const link = page.getByRole("link", { name: label });
      await expect(link).toBeVisible();
      // El contenido no debe desbordar horizontalmente la tarjeta.
      const overflow = await link.evaluate(
        (el) => el.scrollWidth - el.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(1);
    }
  });

  test("la acción 'Buscar' navega a /buscar", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Buscar a una persona" }).click();
    await expect(page).toHaveURL(/\/buscar$/);
    await expect(page.getByRole("heading").first()).toBeVisible();
  });
});
