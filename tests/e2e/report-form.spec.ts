import { test, expect } from "@playwright/test";

test.describe("Formulario de reporte", () => {
  test("el campo Documento solo acepta números", async ({ page }) => {
    await page.goto("/desaparecidos/nuevo");

    const doc = page.getByLabel("Documento de identidad");
    await expect(doc).toBeVisible();

    // Letras, guiones y espacios deben filtrarse; solo quedan dígitos.
    await doc.fill("");
    await doc.pressSequentially("ABC123-45 67");
    await expect(doc).toHaveValue("1234567");
  });

  test("muestra las secciones clave y el botón de publicar (sin enviar)", async ({
    page,
  }) => {
    await page.goto("/desaparecidos/nuevo");

    await expect(
      page.getByRole("heading", { name: "Datos de la persona" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Último contacto" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Publicar reporte" }),
    ).toBeVisible();
  });
});
