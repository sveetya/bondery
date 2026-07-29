import type { FastifyBaseLogger } from "fastify";
import type Stripe from "stripe";
import { getSubscriptionIdFromInvoice } from "../stripe-helpers.js";
import { resetPaymentFailureCount, setPaymentFailureCount } from "../subscription.js";

export async function handleInvoicePaid(
  invoice: Stripe.Invoice,
  log?: FastifyBaseLogger,
): Promise<void> {
  const subscriptionId = getSubscriptionIdFromInvoice(invoice);
  if (!subscriptionId) {
    return;
  }

  await resetPaymentFailureCount(subscriptionId);
  log?.info({ subscriptionId }, "stripe-webhook: payment failure count reset");
}

export async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice,
  log?: FastifyBaseLogger,
): Promise<void> {
  const subscriptionId = getSubscriptionIdFromInvoice(invoice);
  if (!subscriptionId) {
    return;
  }

  const attemptCount = invoice.attempt_count ?? 1;
  await setPaymentFailureCount(subscriptionId, attemptCount);
  log?.info({ attemptCount, subscriptionId }, "stripe-webhook: payment failure recorded");
}
