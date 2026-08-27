import { expect, test } from "@playwright/test";

test.describe("unauthenticated login", () => {
  test("renders /login with GitHub button on desktop", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByTestId("login-github")).toBeVisible();
  });

  test("renders GitHub login on a small viewport", async ({ page }) => {
    await page.setViewportSize({ height: 667, width: 375 });
    await page.goto("/login");
    await expect(page.getByTestId("login-github")).toBeVisible();
  });

  test("blocks /app without session", async ({ page }) => {
    await page.goto("/app/home");
    await expect(page).toHaveURL(/\/login/);
  });

  test("shows stable login UI for ?error=oauth", async ({ page }) => {
    await page.goto("/login?error=oauth");
    await expect(page).toHaveURL(/\/login\?error=oauth/);
    await expect(page.getByTestId("login-github")).toBeVisible();
  });
});
