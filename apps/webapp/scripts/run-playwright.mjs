#!/usr/bin/env node
/**
 * Run Playwright with WSLg DISPLAY fix applied in the same process tree.
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ensureWslgDisplay } from "./ensure-wslg-display.mjs";

const webappRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);

if (ensureWslgDisplay()) {
  console.log("WSLg detected — set DISPLAY=:0 for headed Chromium");
}

for (const script of ["check-e2e-servers.mjs", "check-playwright-display.mjs"]) {
  const check = spawnSync("node", [`scripts/${script}`], {
    cwd: webappRoot,
    env: process.env,
    stdio: "inherit",
  });

  if (check.status !== 0) {
    process.exit(check.status ?? 1);
  }
}

const playwright = spawnSync(
  "npx",
  ["playwright", "test", "-c", "e2e/playwright.config.mjs", ...args],
  {
    cwd: webappRoot,
    env: process.env,
    stdio: "inherit",
  },
);

process.exit(playwright.status ?? 1);
