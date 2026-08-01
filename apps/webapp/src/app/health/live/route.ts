import { buildLivenessStatus } from "@bondery/helpers/infra/build-metadata";

/** Liveness probe for container orchestrators. Does not call upstream API. */
export async function GET() {
  return Response.json(buildLivenessStatus(), {
    headers: { "Cache-Control": "no-store" },
  });
}
