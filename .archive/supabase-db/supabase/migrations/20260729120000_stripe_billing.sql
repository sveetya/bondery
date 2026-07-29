-- Stripe billing migration: rename Polar columns, add mirror fields, webhook idempotency.

ALTER TABLE public.subscriptions
  RENAME COLUMN polar_customer_id TO stripe_customer_id;

ALTER TABLE public.subscriptions
  RENAME COLUMN polar_subscription_id TO stripe_subscription_id;

DROP INDEX IF EXISTS subscriptions_polar_customer_id_idx;

CREATE INDEX subscriptions_stripe_customer_id_idx
  ON public.subscriptions (stripe_customer_id);

ALTER TABLE public.subscriptions
  ADD COLUMN stripe_status text,
  ADD COLUMN trial_ends_at timestamp with time zone,
  ADD COLUMN billing_interval text,
  ADD COLUMN price_id text,
  ADD COLUMN unit_amount integer,
  ADD COLUMN currency text,
  ADD COLUMN product_name text,
  ADD COLUMN payment_failure_count integer NOT NULL DEFAULT 0,
  ADD COLUMN trial_ending_email_sent_at timestamp with time zone;

ALTER TABLE public.pending_subscriptions
  RENAME COLUMN polar_customer_id TO stripe_customer_id;

ALTER TABLE public.pending_subscriptions
  RENAME COLUMN polar_subscription_id TO stripe_subscription_id;

CREATE TABLE public.stripe_webhook_events (
  event_id text NOT NULL,
  event_type text NOT NULL,
  processed_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT stripe_webhook_events_pkey PRIMARY KEY (event_id)
);

ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;
