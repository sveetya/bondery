import { buildReadinessStatus } from "@bondery/helpers/infra/build-metadata";
import { validateWebsiteRuntimeEnv } from "@/lib/platform/readyEnv";

/** Readiness probe — validates public env; does not call upstream services. */
export async function GET() {
  try {
    validateWebsiteRuntimeEnv();
    return Response.json(buildReadinessStatus(true), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid runtime env";
    return Response.json(buildReadinessStatus(false, message), {
      headers: { "Cache-Control": "no-store" },
      status: 503,
    });
  }
}
