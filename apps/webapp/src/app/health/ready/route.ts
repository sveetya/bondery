import { validateWebappRuntimeConfigAtStartup } from "@/lib/platform/runtimeConfig.server";

/** Readiness probe — validates runtime config; does not call upstream API. */
export async function GET() {
  try {
    validateWebappRuntimeConfigAtStartup();
    return Response.json(
      { ok: true },
      {
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch {
    return Response.json(
      { error: "Invalid runtime config", ok: false },
      {
        headers: { "Cache-Control": "no-store" },
        status: 503,
      },
    );
  }
}
