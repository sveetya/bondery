import {
  probeConfigured,
  probeObjectStorage,
  probePostgres,
  probeRedis,
} from "./probes.js";
import type { HealthCheckConfig, HealthReport, HealthServices, HealthStatus } from "./types.js";

const CACHE_TTL_MS = 60_000;

let cachedReport: HealthReport | null = null;
let cacheExpiresAt = 0;

function isSmtpConfigured(config: HealthCheckConfig): boolean {
  return Boolean(
    config.smtpHost.trim() &&
      config.smtpUser.trim() &&
      config.smtpPass.trim() &&
      config.smtpAddress.trim() &&
      config.smtpPort,
  );
}

function isStripeConfigured(config: HealthCheckConfig): boolean {
  return Boolean(
    config.stripeSecretKey.trim() &&
      config.stripePriceIdMonthly.trim() &&
      config.stripePriceIdAnnual.trim() &&
      config.stripeWebhookSecret.trim(),
  );
}

function isPosthogConfigured(config: HealthCheckConfig): boolean {
  return Boolean(config.posthogApiSecret.trim() && config.posthogProjectId.trim());
}

function deriveOverallStatus(services: HealthServices): HealthStatus {
  const critical = [services.postgres, services.storage, services.smtp];

  if (critical.some((service) => !service.ok)) {
    return "unhealthy";
  }

  const optionalLive = [services.redis];
  const optionalConfigured = [services.anthropic, services.stripe, services.mapy, services.posthog];

  if (
    optionalLive.some((service) => service.configured !== false && !service.ok) ||
    optionalConfigured.some((service) => service.configured && !service.ok)
  ) {
    return "degraded";
  }

  return "ok";
}

async function runProbes(config: HealthCheckConfig): Promise<HealthServices> {
  const [postgres, storage, redis] = await Promise.all([
    probePostgres(),
    probeObjectStorage(config.storageS3Endpoint),
    probeRedis(config.redisUrl),
  ]);

  return {
    anthropic: probeConfigured(Boolean(config.anthropicApiKey.trim())),
    mapy: probeConfigured(Boolean(config.mapsApiKey.trim())),
    stripe: probeConfigured(isStripeConfigured(config)),
    posthog: probeConfigured(isPosthogConfigured(config)),
    postgres,
    redis,
    smtp: probeConfigured(isSmtpConfigured(config), { required: true }),
    storage,
  };
}

export async function getHealthReport(config: HealthCheckConfig): Promise<HealthReport> {
  const now = Date.now();

  if (cachedReport && now < cacheExpiresAt) {
    return {
      ...cachedReport,
      cached: true,
    };
  }

  const services = await runProbes(config);
  const timestamp = new Date().toISOString();
  cacheExpiresAt = now + CACHE_TTL_MS;

  const report: HealthReport = {
    cached: false,
    cacheExpiresAt: new Date(cacheExpiresAt).toISOString(),
    services,
    status: deriveOverallStatus(services),
    timestamp,
  };

  cachedReport = report;
  return report;
}

/** Clears the in-memory cache — exposed for tests. */
export function resetHealthCheckCache(): void {
  cachedReport = null;
  cacheExpiresAt = 0;
}
