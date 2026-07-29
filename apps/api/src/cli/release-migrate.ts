import { runReleaseMigrate } from "@bondery/db/release-migrate";
import { provisionOAuthClients } from "../lib/bootstrap/provision-oauth-clients.js";
import { provisionPlatformAdmins } from "../lib/bootstrap/provision-platform-admins.js";

async function main(): Promise<void> {
  await runReleaseMigrate({
    provisionOAuthClients,
    provisionPlatformAdmins,
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
