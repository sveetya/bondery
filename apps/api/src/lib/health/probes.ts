import { HeadBucketCommand, S3Client } from "@aws-sdk/client-s3";
import { prisma } from "@bondery/db";
import { Redis } from "ioredis";
import { STORAGE_BUCKETS } from "../storage/ensure-buckets.js";
import type { ServiceProbeResult } from "./types.js";

const DEFAULT_PROBE_TIMEOUT_MS = 5_000;

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

function classifyProbeError(error: unknown): string {
  if (error instanceof Error) {
    if (error.name === "AbortError") {
      return "timeout";
    }
    if (error.message.includes("fetch failed")) {
      return "unreachable";
    }
    return error.message;
  }
  return "unknown";
}

/** Prisma ping against the app's primary Postgres database. */
export async function probePostgres(): Promise<ServiceProbeResult> {
  const started = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { latencyMs: Date.now() - started, ok: true };
  } catch (error) {
    return {
      error: classifyProbeError(error),
      latencyMs: Date.now() - started,
      ok: false,
    };
  }
}

/** SeaweedFS S3 gateway health (`GET /status`). */
export async function probeObjectStorage(storageS3Endpoint: string): Promise<ServiceProbeResult> {
  const baseUrl = normalizeBaseUrl(storageS3Endpoint);
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_PROBE_TIMEOUT_MS);

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

type StorageBucketProbeConfig = {
  accessKeyId: string;
  endpoint: string;
  region: string;
  secretAccessKey: string;
};

/** Required S3 buckets exist (HeadBucket only — does not create buckets). */
export async function probeStorageBuckets(
  config: StorageBucketProbeConfig,
): Promise<ServiceProbeResult> {
  const started = Date.now();
  const client = new S3Client({
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    endpoint: config.endpoint,
    forcePathStyle: true,
    region: config.region,
  });

  try {
    for (const bucket of STORAGE_BUCKETS) {
      await client.send(new HeadBucketCommand({ Bucket: bucket }));
    }

    return { latencyMs: Date.now() - started, ok: true };
  } catch (error) {
    return {
      error: classifyProbeError(error),
      latencyMs: Date.now() - started,
      ok: false,
    };
  } finally {
    client.destroy();
  }
}

export async function probeRedis(redisUrl: string): Promise<ServiceProbeResult> {
  const trimmed = redisUrl.trim();
  if (!trimmed) {
    return { configured: false, ok: true };
  }

  const started = Date.now();
  const client = new Redis(trimmed, {
    connectTimeout: DEFAULT_PROBE_TIMEOUT_MS,
    enableReadyCheck: true,
    lazyConnect: true,
    maxRetriesPerRequest: 0,
  });

  try {
    await client.connect();
    const pong = await client.ping();
    const latencyMs = Date.now() - started;

    if (pong !== "PONG") {
      return {
        configured: true,
        error: "unexpected_response",
        latencyMs,
        ok: false,
      };
    }

    return { configured: true, latencyMs, ok: true };
  } catch (error) {
    return {
      configured: true,
      error: classifyProbeError(error),
      latencyMs: Date.now() - started,
      ok: false,
    };
  } finally {
    client.disconnect();
  }
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
