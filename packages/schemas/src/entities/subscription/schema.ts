import { z } from "zod";
import { entityAuditSchema, nullableDateTimeSchema } from "../_shared/schema.js";
import type {
  BillingInterval,
  BillingSubscriptionStatus,
  PlanTier,
  Subscription,
  SubscriptionStatus,
  SubscriptionStatusValue,
} from "./types.js";

export const subscriptionStatusValueSchema: z.ZodType<SubscriptionStatusValue> = z.enum([
  "active",
  "canceling",
  "canceled",
  "revoked",
  "past_due",
]);

/** Subscription table row shape (internal). */
export const subscriptionSchema: z.ZodType<Subscription> = z
  .object({
    cancelAtPeriodEnd: z.boolean(),
    currentPeriodEnd: nullableDateTimeSchema,
    id: z.string(),
    status: subscriptionStatusValueSchema,
    stripeCustomerId: z.string(),
    stripeSubscriptionId: z.string(),
    userId: z.string(),
  })
  .extend(entityAuditSchema.shape);

export const planTierSchema: z.ZodType<PlanTier> = z.enum(["free", "premium"]);

export const billingSubscriptionStatusSchema: z.ZodType<BillingSubscriptionStatus> = z.enum([
  "incomplete",
  "incomplete_expired",
  "trialing",
  "active",
  "past_due",
  "canceled",
  "unpaid",
]);

export const billingIntervalSchema: z.ZodType<BillingInterval> = z.enum(["month", "year"]);

export const subscriptionStatusSchema: z.ZodType<SubscriptionStatus> = z.object({
  aiMessageLimit: z.number(),
  aiMessagesUsed: z.number(),
  aiMonthlyResetAt: nullableDateTimeSchema,
  amount: z.number().nullable(),
  billingStatus: billingSubscriptionStatusSchema.nullable(),
  cancelAtPeriodEnd: z.boolean(),
  canUseChat: z.boolean(),
  currency: z.string().nullable(),
  currentPeriodEnd: nullableDateTimeSchema,
  paymentBlocked: z.boolean(),
  plan: planTierSchema,
  productName: z.string().nullable(),
  recurringInterval: billingIntervalSchema.nullable(),
  trialEndsAt: nullableDateTimeSchema,
  upgradesEnabled: z.boolean(),
});
