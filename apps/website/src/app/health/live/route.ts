import { buildLivenessStatus } from "@bondery/helpers/infra/build-metadata";

/** Liveness probe for container orchestrators. Does not validate env. */
export async function GET() {
  return Response.json(buildLivenessStatus(), {
    headers: { "Cache-Control": "no-store" },
  });
}
