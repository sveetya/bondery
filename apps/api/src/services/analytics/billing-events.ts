import type Stripe from "stripe";
import type { DomainContext } from "../../domains/_shared/context.js";
import { isScheduledToCancel } from "../billing/stripe-helpers.js";
import { captureProductEvent } from "./posthog-capture.js";

export type PlanInterval = "month" | "year";
export type PlanTier = "premium";

export function resolvePlanInterval(interval: string | null | undefined): PlanInterval | undefined {
  if (interval === "month" || interval === "year") {
    return interval;
  }
  return undefined;
}

export function resolvePlanTier(_productName: string | null | undefined): PlanTier {
  return "premium";
}

export async function captureSubscriptionCreate(
  userId: string,
  subscription: Stripe.Subscription,
  mirror: {
    billingInterval?: string | null;
    productName?: string | null;
  },
): Promise<void> {
  const ctx: DomainContext = {
    user: { email: "", id: userId },
  };

  await captureProductEvent(ctx, "billing:subscription_create", {
    cancel_at_period_end: isScheduledToCancel(subscription),
    plan_interval: resolvePlanInterval(mirror.billingInterval),
    plan_tier: resolvePlanTier(mirror.productName),
  });
}

export async function captureSubscriptionCancel(
  userId: string,
  subscription: Stripe.Subscription,
  mirror: {
    billingInterval?: string | null;
    productName?: string | null;
  },
): Promise<void> {
  const ctx: DomainContext = {
    user: { email: "", id: userId },
  };

  await captureProductEvent(ctx, "billing:subscription_cancel", {
    cancel_at_period_end: isScheduledToCancel(subscription),
    plan_interval: resolvePlanInterval(mirror.billingInterval),
    plan_tier: resolvePlanTier(mirror.productName),
  });
}
