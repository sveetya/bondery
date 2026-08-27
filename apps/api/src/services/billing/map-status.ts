import type { SubscriptionStatusValue } from "@bondery/schemas";

export type StripeSubscriptionStatus =
  | "incomplete"
  | "incomplete_expired"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "paused";

/**
 * Maps a Stripe subscription status to Bondery's local mirror status.
 */
export function mapStripeStatus(
  stripeStatus: string,
  cancelAtPeriodEnd: boolean,
): SubscriptionStatusValue {
  switch (stripeStatus) {
    case "trialing":
    case "active":
      return cancelAtPeriodEnd ? "canceling" : "active";
    case "canceled":
    case "incomplete_expired":
    case "unpaid":
      return "canceled";
    case "past_due":
    case "incomplete":
      return "past_due";
    default:
      return "past_due";
  }
}
