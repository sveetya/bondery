import type Stripe from "stripe";

export function getSubscriptionPeriod(subscription: Stripe.Subscription): {
  currentPeriodEnd: Date | null;
  currentPeriodStart: Date | null;
} {
  const item = subscription.items.data[0];
  if (!item) {
    return { currentPeriodEnd: null, currentPeriodStart: null };
  }

  return {
    currentPeriodEnd: new Date(item.current_period_end * 1000),
    currentPeriodStart: new Date(item.current_period_start * 1000),
  };
}

export function getSubscriptionIdFromInvoice(invoice: Stripe.Invoice): string | null {
  const subscription = invoice.parent?.subscription_details?.subscription;
  if (!subscription) {
    return null;
  }
  return typeof subscription === "string" ? subscription : subscription.id;
}
