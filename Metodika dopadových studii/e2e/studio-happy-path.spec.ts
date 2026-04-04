import { expect, test } from "@playwright/test";

/**
 * Happy path: ukázková data v úložišti průvodce → výsledky → report → tisková verze.
 * Client-side navigace zachovává Zustand (výsledky výpočtu nejsou v localStorage).
 */
test("průvodce → výsledky → report → tisková verze", async ({ page }) => {
  await page.goto("/studio");
  await expect(
    page.getByRole("heading", { name: "Průvodce studií dopadů" }),
  ).toBeVisible();

  const advance = page.getByRole("button", {
    name: /Další|Vypočítat výsledky/,
  });
  for (let i = 0; i < 8; i++) {
    await advance.click();
  }

  await expect(
    page.getByRole("button", { name: "Přepočíst všechny scénáře" }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Výstupní report" }).click();
  await expect(page).toHaveURL(/\/report$/);
  await expect(
    page.getByRole("heading", { name: "Výstupní report studie dopadů" }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Tisková verze / PDF" }).click();
  await expect(page).toHaveURL(/\/report\/print$/);
  await expect(
    page.getByRole("button", { name: "Tisk nebo uložit jako PDF" }),
  ).toBeVisible();
});
