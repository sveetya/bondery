import { verifyEmailTransport } from "../notifications/transporter.js";
import type { ServiceProbeResult } from "./types.js";

function readinessToProbeResult(
  readiness: Awaited<ReturnType<typeof verifyEmailTransport>>,
): ServiceProbeResult {
  if (!readiness.configured) {
    return {
      configured: false,
      ok: readiness.ok,
      ...(readiness.error ? { error: readiness.error } : {}),
    };
  }

  return {
    configured: true,
    error: readiness.error,
    latencyMs: readiness.latencyMs,
    ok: readiness.ok,
  };
}

/** Live SMTP verify via the shared transporter pool. */
export async function probeSmtp(): Promise<ServiceProbeResult> {
  const readiness = await verifyEmailTransport();
  return readinessToProbeResult(readiness);
}
