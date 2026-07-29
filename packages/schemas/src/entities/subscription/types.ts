export type SubscriptionStatusValue = "active" | "canceling" | "canceled" | "revoked" | "past_due";

export interface Subscription {
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  currentPeriodEnd: string | null;
  id: string;
  status: SubscriptionStatusValue;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  updatedAt: string;
  userId: string;
}

export type PlanTier = "free" | "premium";

export type BillingSubscriptionStatus =
  | "incomplete"
  | "incomplete_expired"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "unpaid";

export type BillingInterval = "month" | "year";

export interface SubscriptionStatus {
  aiMessageLimit: number;
  aiMessagesUsed: number;
  aiMonthlyResetAt: string | null;
  amount: number | null;
  billingStatus: BillingSubscriptionStatus | null;
  cancelAtPeriodEnd: boolean;
  canUseChat: boolean;
  currency: string | null;
  currentPeriodEnd: string | null;
  paymentBlocked: boolean;
  plan: PlanTier;
  productName: string | null;
  recurringInterval: BillingInterval | null;
  trialEndsAt: string | null;
  upgradesEnabled: boolean;
}
