import { expect, test } from "@playwright/test";

test("invalid oauth flow cookie redirects to login with oauth error", async ({ page }) => {
  await page.goto("/auth/oauth-callback?code=invalid&state=invalid");
  await expect(page).toHaveURL(/\/login\?error=oauth/);
});
