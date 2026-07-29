import type { z } from "zod";
import type { Assert, IsEqual } from "#internal/type-equality.js";
import type {
  billingIntervalSchema,
  billingSubscriptionStatusSchema,
  planTierSchema,
  subscriptionSchema,
  subscriptionStatusSchema,
  subscriptionStatusValueSchema,
} from "./schema.js";
import type {
  BillingInterval,
  BillingSubscriptionStatus,
  PlanTier,
  Subscription,
  SubscriptionStatus,
  SubscriptionStatusValue,
} from "./types.js";

type _SubscriptionStatusValue = Assert<
  IsEqual<SubscriptionStatusValue, z.infer<typeof subscriptionStatusValueSchema>>
>;
type _Subscription = Assert<IsEqual<Subscription, z.infer<typeof subscriptionSchema>>>;
type _PlanTier = Assert<IsEqual<PlanTier, z.infer<typeof planTierSchema>>>;
type _BillingSubscriptionStatus = Assert<
  IsEqual<BillingSubscriptionStatus, z.infer<typeof billingSubscriptionStatusSchema>>
>;
type _BillingInterval = Assert<
  IsEqual<BillingInterval, z.infer<typeof billingIntervalSchema>>
>;
type _SubscriptionStatus = Assert<
  IsEqual<SubscriptionStatus, z.infer<typeof subscriptionStatusSchema>>
>;
