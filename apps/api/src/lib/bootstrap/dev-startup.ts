import { runReleaseMigrate } from "@bondery/db/release-migrate";
import { ensureStorageBuckets } from "../storage/ensure-buckets.js";
import { provisionOAuthClients } from "./provision-oauth-clients.js";
import { provisionPlatformAdmins } from "./provision-platform-admins.js";

function isDevFlagEnabled(name: string): boolean {
  const flag = process.env[name]?.trim().toLowerCase();
  return flag === "1" || flag === "true" || flag === "yes";
}

/** Host-run dev bootstrap — Compose `pre_start` handles production. */
export async function runDevelopmentBootstrap(): Promise<void> {
  if (!isDevFlagEnabled("BONDERY_DEV_SKIP_RELEASE_MIGRATE")) {
    await runReleaseMigrate({
      provisionOAuthClients,
      provisionPlatformAdmins,
    });
  }

  if (!isDevFlagEnabled("BONDERY_DEV_SKIP_STORAGE_BUCKETS")) {
    await ensureStorageBuckets();
  }
}
