import { expect, test } from "@playwright/test";

test.use({ storageState: { cookies: [], origins: [] } });

test("login with GitHub", async ({ page }) => {
  await page.goto("/login");
  await page.getByTestId("login-github").click();

  if (process.env.E2E_PAUSE_GITHUB === "1") {
    await page.pause();
  } else {
    await page.waitForURL(/\/app\//, { timeout: 300_000 });
  }

  await expect(page).toHaveURL(/\/app\//);
  await expect(page).not.toHaveURL(/error=oauth/);

  const cookies = await page.context().cookies();
  expect(cookies.some((cookie) => cookie.name === "bondery_webapp_session")).toBe(true);
});
