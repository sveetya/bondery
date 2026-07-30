import { verifyPostgres } from "../data/postgres.js";
import { verifyRedis } from "../data/redis.js";
import { verifyObjectStorage } from "../storage/init-storage.js";
import { classifyProbeError } from "./errors.js";
import type { ServiceProbeResult } from "./types.js";

export { probeSmtp } from "./probe-smtp.js";

type ReadinessLike = {
  configured: boolean;
  error?: string;
  latencyMs?: number;
  ok: boolean;
};

function readinessToProbeResult(readiness: ReadinessLike): ServiceProbeResult {
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

/** Prisma ping against the app's primary Postgres database. */
export async function probePostgres(): Promise<ServiceProbeResult> {
  const readiness = await verifyPostgres();
  return readinessToProbeResult(readiness);
}

export type StorageProbeConfig = {
  accessKeyId: string;
  endpoint: string;
  region: string;
  secretAccessKey: string;
};

/** SeaweedFS S3 gateway + required bucket HeadBucket checks. */
export async function probeObjectStorage(config: StorageProbeConfig): Promise<ServiceProbeResult> {
  const readiness = await verifyObjectStorage(config);
  return readinessToProbeResult(readiness);
}

/** @deprecated Use probeObjectStorage with full S3 config. Kept for direct gateway-only checks in tests. */
export async function probeStorageGateway(endpoint: string): Promise<ServiceProbeResult> {
  const started = Date.now();
  const baseUrl = endpoint.replace(/\/+$/, "");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5_000);

  try {
    const response = await fetch(`${baseUrl}/status`, {
      method: "GET",
      signal: controller.signal,
    });

    const latencyMs = Date.now() - started;
    if (!response.ok) {
      return {
        error: `http_${response.status}`,
        latencyMs,
        ok: false,
      };
    }

    return { latencyMs, ok: true };
  } catch (error) {
    return {
      error: classifyProbeError(error),
      latencyMs: Date.now() - started,
      ok: false,
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function probeRedis(redisUrl: string): Promise<ServiceProbeResult> {
  const readiness = await verifyRedis(redisUrl);
  return readinessToProbeResult(readiness);
}

export function probeConfigured(
  configured: boolean,
  options?: { required?: boolean },
): ServiceProbeResult {
  const required = options?.required ?? false;
  return {
    configured,
    ok: configured || !required,
    ...(configured || required ? {} : { error: "not_configured" }),
  };
}
