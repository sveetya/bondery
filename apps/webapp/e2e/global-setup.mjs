import { killDevPort } from "../../../scripts/kill-dev-port.mjs";
import { ensureWslgDisplay } from "../scripts/ensure-wslg-display.mjs";

const E2E_PORTS = [26631, 26632];

/**
 * Free dev ports before Playwright starts webServer entries.
 * Skip when reusing an intentional dev stack (`E2E_REUSE_SERVER=1`).
 */
export default async function globalSetup() {
  if (ensureWslgDisplay()) {
  }

  if (process.env.E2E_REUSE_SERVER === "1") {
    return;
  }

  const blocked = [];
  for (const port of E2E_PORTS) {
    if (!killDevPort(port, { quiet: true })) {
      blocked.push(port);
    }
  }

  if (blocked.length > 0) {
    throw new Error(
      `E2E could not free port(s) ${blocked.join(", ")}. ` +
        "Run `pnpm run kill:dev` from the repo root, or set E2E_REUSE_SERVER=1 " +
        "if you already have `pnpm run dev:webapp-api` running.",
    );
  }
}
