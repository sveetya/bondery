import "server-only";

import { validateWebappRuntimeConfigAtStartup } from "@/lib/platform/runtimeConfig.server";

/** Node-only startup validation (uses process.exit — never import from Edge). */
export function validateWebappStartup(): void {
  try {
    validateWebappRuntimeConfigAtStartup();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    // biome-ignore lint/suspicious/noConsole: fail-fast boot diagnostics before logger exists
    console.error(`[webapp] Runtime config validation failed:\n${message}`);
    process.exit(1);
  }
}
