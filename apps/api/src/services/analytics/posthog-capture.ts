import { PostHog } from "posthog-node";
import type { DomainContext } from "../../domains/_shared/context.js";
import { domainDb } from "../../domains/_shared/domain-db.js";

const posthogKey = process.env.BONDERY_PUBLIC_POSTHOG_KEY ?? "";
const posthogHost = process.env.BONDERY_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com";

const posthogClient = posthogKey
  ? new PostHog(posthogKey, {
      flushAt: 1,
      flushInterval: 0,
      host: posthogHost,
    })
  : null;

const analyticsEnabledCache = new Map<string, { enabled: boolean; expiresAt: number }>();
const ANALYTICS_CACHE_TTL_MS = 60_000;

async function isProductAnalyticsEnabled(ctx: DomainContext): Promise<boolean> {
  const { user } = ctx;
  const cached = analyticsEnabledCache.get(user.id);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.enabled;
  }

  const db = domainDb(ctx);
  const settings = await db.userSettings.findUnique({
    select: { productAnalyticsEnabled: true },
    where: { userId: user.id },
  });

  const enabled = settings?.productAnalyticsEnabled ?? true;
  analyticsEnabledCache.set(user.id, {
    enabled,
    expiresAt: Date.now() + ANALYTICS_CACHE_TTL_MS,
  });
  return enabled;
}

export function invalidateProductAnalyticsCache(userId: string): void {
  analyticsEnabledCache.delete(userId);
}

/**
 * Server-side PostHog capture for authoritative product events.
 * Respects the user's product analytics opt-out preference.
 */
export async function captureProductEvent(
  ctx: DomainContext,
  event: string,
  properties?: Record<string, unknown>,
): Promise<void> {
  if (!posthogClient) {
    return;
  }

  if (!(await isProductAnalyticsEnabled(ctx))) {
    return;
  }

  posthogClient.capture({
    distinctId: ctx.user.id,
    event,
    properties,
  });

  await posthogClient.flush();
}
