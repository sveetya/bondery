import { ensureStorageBuckets } from "../lib/storage/ensure-buckets.js";

async function main(): Promise<void> {
  await ensureStorageBuckets();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
