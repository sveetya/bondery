#!/usr/bin/env tsx
/**
 * Thin CLI wrapper — logic lives in src/lib/bootstrap/provision-platform-admins.ts.
 *
 * Usage: tsx --env-file=.env.development.local scripts/provision-platform-admins.ts
 */
import { provisionPlatformAdmins } from "../src/lib/bootstrap/provision-platform-admins.js";

async function main(): Promise<void> {
  await provisionPlatformAdmins();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { provisionPlatformAdmins } from "../src/lib/bootstrap/provision-platform-admins.js";
