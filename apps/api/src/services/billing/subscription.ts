import { prisma } from "@bondery/db";
import { internal } from "../../lib/platform/errors/http-errors.js";

export type SubscriptionMirrorFields = {
  billingInterval?: string | null;
  currency?: string | null;
  paymentFailureCount?: number;
  priceId?: string | null;
  productName?: string | null;
  stripeStatus?: string | null;
  trialEndsAt?: Date | null;
  unitAmount?: number | null;
};

export async function findUserIdByEmail(email: string): Promise<string | null> {
  const user = await prisma.user.findFirst({
    select: { id: true },
    where: { email },
  });

  return user?.id ?? null;
}

export async function upsertSubscription(
  userId: string,
  stripeCustomerId: string,
  stripeSubscriptionId: string,
  status: string,
  currentPeriodStart: Date | null,
  currentPeriodEnd: Date | null,
  cancelAtPeriodEnd: boolean,
  mirror: SubscriptionMirrorFields = {},
): Promise<void> {
  const data = {
    billingInterval: mirror.billingInterval ?? null,
    cancelAtPeriodEnd,
    currency: mirror.currency ?? null,
    currentPeriodEnd,
    currentPeriodStart,
    paymentFailureCount: mirror.paymentFailureCount ?? 0,
    priceId: mirror.priceId ?? null,
    productName: mirror.productName ?? null,
    status,
    stripeCustomerId,
    stripeStatus: mirror.stripeStatus ?? null,
    stripeSubscriptionId,
    trialEndsAt: mirror.trialEndsAt ?? null,
    unitAmount: mirror.unitAmount ?? null,
    userId,
  };

  const existing = await prisma.subscription.findFirst({
    select: { id: true },
    where: { userId },
  });

  try {
    if (existing) {
      await prisma.subscription.update({
        data,
        where: { id: existing.id },
      });
      return;
    }

    await prisma.subscription.create({ data });
  } catch (error) {
    throw internal("billing_subscription_upsert_failed", error);
  }
}

export async function storePendingSubscription(
  email: string,
  stripeCustomerId: string,
  stripeSubscriptionId: string,
  status: string,
  currentPeriodEnd: Date | null,
  cancelAtPeriodEnd: boolean,
): Promise<void> {
  try {
    await prisma.pendingSubscription.upsert({
      create: {
        cancelAtPeriodEnd,
        currentPeriodEnd,
        email,
        status,
        stripeCustomerId,
        stripeSubscriptionId,
      },
      update: {
        cancelAtPeriodEnd,
        currentPeriodEnd,
        status,
        stripeCustomerId,
        stripeSubscriptionId,
      },
      where: { email },
    });
  } catch (error) {
    throw internal("billing_pending_subscription_store_failed", error);
  }
}

export async function deletePendingSubscription(email: string): Promise<void> {
  await prisma.pendingSubscription.deleteMany({ where: { email } });
}

export async function resetPaymentFailureCount(stripeSubscriptionId: string): Promise<void> {
  try {
    await prisma.subscription.update({
      data: { paymentFailureCount: 0 },
      where: { stripeSubscriptionId },
    });
  } catch (error) {
    throw internal("billing_subscription_upsert_failed", error);
  }
}

export async function setPaymentFailureCount(
  stripeSubscriptionId: string,
  attemptCount: number,
): Promise<void> {
  try {
    await prisma.subscription.update({
      data: { paymentFailureCount: attemptCount },
      where: { stripeSubscriptionId },
    });
  } catch (error) {
    throw internal("billing_subscription_upsert_failed", error);
  }
}

export async function markTrialEndingEmailSent(stripeSubscriptionId: string): Promise<void> {
  try {
    await prisma.subscription.update({
      data: { trialEndingEmailSentAt: new Date() },
      where: { stripeSubscriptionId },
    });
  } catch (error) {
    throw internal("billing_subscription_upsert_failed", error);
  }
}

export async function getSubscriptionByStripeId(stripeSubscriptionId: string): Promise<{
  trialEndingEmailSentAt: string | null;
  userId: string;
} | null> {
  try {
    const row = await prisma.subscription.findUnique({
      select: { trialEndingEmailSentAt: true, userId: true },
      where: { stripeSubscriptionId },
    });

    if (!row) {
      return null;
    }

    return {
      trialEndingEmailSentAt: row.trialEndingEmailSentAt?.toISOString() ?? null,
      userId: row.userId,
    };
  } catch (error) {
    throw internal("billing_subscription_upsert_failed", error);
  }
}

export { mapStripeStatus } from "./map-status.js";
