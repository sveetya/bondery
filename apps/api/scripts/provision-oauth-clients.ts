#!/usr/bin/env tsx
/**
 * Thin CLI wrapper — logic lives in src/lib/bootstrap/provision-oauth-clients.ts.
 *
 * Usage: tsx --env-file=.env.development.local scripts/provision-oauth-clients.ts
 */
import { provisionOAuthClients } from "../src/lib/bootstrap/provision-oauth-clients.js";

async function main(): Promise<void> {
  await provisionOAuthClients();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export {
  hashOAuthClientSecret,
  provisionExtensionClient,
  provisionOAuthClients,
  provisionWebappClient,
  resolveResourceId,
} from "../src/lib/bootstrap/provision-oauth-clients.js";
