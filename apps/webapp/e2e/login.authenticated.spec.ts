import fs from "node:fs";
import { expect, test } from "@playwright/test";

const authFile = ".auth/user.json";
const HOME = "/app/home";
const SETTINGS = "/app/settings";

test.beforeEach(() => {
  test.skip(!fs.existsSync(authFile), "Run pnpm run test:e2e:auth-setup first");
});

test.describe("authenticated session", () => {
  test("loads app shell without redirect to login", async ({ page }) => {
    await page.goto(HOME);
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page).toHaveURL(/\/app\//);
  });

  test("reload preserves session", async ({ page }) => {
    await page.goto(HOME);
    await expect(page).toHaveURL(/\/app\//);

    await page.reload();
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page).toHaveURL(/\/app\//);

    const cookies = await page.context().cookies();
    expect(cookies.some((cookie) => cookie.name === "bondery_webapp_session")).toBe(true);
  });

  test("logout clears session and blocks /app", async ({ page }) => {
    await page.goto(`${SETTINGS}`);
    await expect(page).not.toHaveURL(/\/login/);

    await page.getByRole("button", { name: /sign out/i }).click();
    await page.waitForURL(/\/login/, { timeout: 60_000 });

    await page.goto(HOME);
    await expect(page).toHaveURL(/\/login/);
  });
});
