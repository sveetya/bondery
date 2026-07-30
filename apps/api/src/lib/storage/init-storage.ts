import { HeadBucketCommand, S3Client } from "@aws-sdk/client-s3";
import type { FastifyBaseLogger } from "fastify";

import { classifyProbeError } from "../health/errors.js";
import {
  assertRuntimeDependencyConfigured,
  shouldSkipLiveRuntimeVerify,
} from "../platform/runtime-env.js";
import { STORAGE_BUCKETS } from "./ensure-buckets.js";

export type StorageInitConfig = {
  accessKeyId: string;
  endpoint: string;
  region: string;
  secretAccessKey: string;
};

export type StorageReadiness = {
  configured: boolean;
  error?: string;
  latencyMs?: number;
  ok: boolean;
  verifiedAt: string;
};

const DEFAULT_PROBE_TIMEOUT_MS = 5_000;

const UNCONFIGURED_READINESS: StorageReadiness = {
  configured: false,
  ok: true,
  verifiedAt: new Date(0).toISOString(),
};

let storageReadiness: StorageReadiness | null = null;

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

function isStorageConfigured(config: StorageInitConfig): boolean {
  return Boolean(
    config.endpoint.trim() &&
      config.region.trim() &&
      config.accessKeyId.trim() &&
      config.secretAccessKey.trim(),
  );
}

function setUnconfiguredReadiness(): StorageReadiness {
  storageReadiness = { ...UNCONFIGURED_READINESS, verifiedAt: new Date().toISOString() };
  return storageReadiness;
}

function setMissingReadiness(): StorageReadiness {
  storageReadiness = {
    configured: false,
    error: "not_configured",
    ok: false,
    verifiedAt: new Date().toISOString(),
  };
  return storageReadiness;
}

async function probeGateway(
  endpoint: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const baseUrl = normalizeBaseUrl(endpoint);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_PROBE_TIMEOUT_MS);

  try {
    const response = await fetch(`${baseUrl}/status`, {
      method: "GET",
      signal: controller.signal,
    });

    if (!response.ok) {
      return { error: `http_${response.status}`, ok: false };
    }

    return { ok: true };
  } catch (error) {
    return { error: classifyProbeError(error), ok: false };
  } finally {
    clearTimeout(timer);
  }
}

async function probeBuckets(
  config: StorageInitConfig,
): Promise<{ ok: true } | { ok: false; error: string }> {
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

    return { ok: true };
  } catch (error) {
    return { error: classifyProbeError(error), ok: false };
  } finally {
    client.destroy();
  }
}

async function runStorageVerify(config: StorageInitConfig): Promise<StorageReadiness> {
  const started = Date.now();
  const verifiedAt = new Date().toISOString();

  const gateway = await probeGateway(config.endpoint);
  if (!gateway.ok) {
    storageReadiness = {
      configured: true,
      error: gateway.error,
      latencyMs: Date.now() - started,
      ok: false,
      verifiedAt,
    };
    return storageReadiness;
  }

  const buckets = await probeBuckets(config);
  if (!buckets.ok) {
    storageReadiness = {
      configured: true,
      error: buckets.error,
      latencyMs: Date.now() - started,
      ok: false,
      verifiedAt,
    };
    return storageReadiness;
  }

  storageReadiness = {
    configured: true,
    latencyMs: Date.now() - started,
    ok: true,
    verifiedAt,
  };
  return storageReadiness;
}

export function getStorageReadiness(): StorageReadiness {
  return storageReadiness ?? UNCONFIGURED_READINESS;
}

/**
 * Eager object storage verify on startup. Required in development and production; skipped in test.
 */
export async function initObjectStorage(
  log: FastifyBaseLogger | undefined,
  config: StorageInitConfig,
): Promise<StorageReadiness> {
  if (!isStorageConfigured(config)) {
    assertRuntimeDependencyConfigured(false, "BONDERY_PRIVATE_S3_* must be set");
    log?.info("Object storage not configured — skipping verify in test");
    return setUnconfiguredReadiness();
  }

  if (shouldSkipLiveRuntimeVerify()) {
    log?.info("Object storage verify skipped in test environment");
    storageReadiness = {
      configured: true,
      ok: true,
      verifiedAt: new Date().toISOString(),
    };
    return storageReadiness;
  }

  const readiness = await runStorageVerify(config);
  if (readiness.ok) {
    log?.info({ latencyMs: readiness.latencyMs }, "Object storage verified");
  } else {
    log?.error(
      { error: readiness.error, latencyMs: readiness.latencyMs },
      "Object storage verify failed",
    );
    throw new Error(`Object storage verify failed: ${readiness.error ?? "unknown"}`);
  }

  return readiness;
}

/** Re-verify object storage (used by /health/ready when cache is cold). */
export async function verifyObjectStorage(config: StorageInitConfig): Promise<StorageReadiness> {
  if (!isStorageConfigured(config)) {
    if (shouldSkipLiveRuntimeVerify()) {
      return setUnconfiguredReadiness();
    }

    return setMissingReadiness();
  }

  if (shouldSkipLiveRuntimeVerify()) {
    storageReadiness = {
      configured: true,
      ok: true,
      verifiedAt: new Date().toISOString(),
    };
    return storageReadiness;
  }

  return runStorageVerify(config);
}

/** @internal Test-only reset. */
export function resetStorageReadinessForTests(): void {
  storageReadiness = null;
}
