import { buildReadinessStatus } from "@bondery/helpers/infra/build-metadata";
import { validateWebappRuntimeConfigAtStartup } from "@/lib/platform/runtimeConfig.server";

/** Readiness probe — validates runtime config; does not call upstream API. */
export async function GET() {
  try {
    validateWebappRuntimeConfigAtStartup();
    return Response.json(buildReadinessStatus(true), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json(buildReadinessStatus(false, "Invalid runtime config"), {
      headers: { "Cache-Control": "no-store" },
      status: 503,
    });
  }
}
