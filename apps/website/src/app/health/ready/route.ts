import { buildReadinessStatus } from "@bondery/helpers/infra/build-metadata";
import { validateWebsiteRuntimeEnv } from "@/lib/platform/readyEnv";

/** Readiness probe — validates public env; does not call upstream services. */
export async function GET() {
  try {
    validateWebsiteRuntimeEnv();
    return Response.json(buildReadinessStatus(true), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json(buildReadinessStatus(false, "Invalid runtime env"), {
      headers: { "Cache-Control": "no-store" },
      status: 503,
    });
  }
}
