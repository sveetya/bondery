import { buildReadinessStatus } from "@bondery/helpers/infra/build-metadata";
import { validateWebappRuntimeConfigAtStartup } from "@/lib/platform/runtimeConfig.server";

/** Readiness probe — validates runtime config; does not call upstream API. */
export async function GET() {
  try {
    validateWebappRuntimeConfigAtStartup();
    return Response.json(buildReadinessStatus(true), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid runtime config";
    return Response.json(buildReadinessStatus(false, message), {
      headers: { "Cache-Control": "no-store" },
      status: 503,
    });
  }
}
