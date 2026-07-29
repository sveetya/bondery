/**
 * Subscription Checkout Route
 *
 * POST /api/subscriptions/checkout
 *
 * Creates a Stripe embedded Checkout session for the authenticated user.
 * Returns the client secret for initEmbeddedCheckout on the web client.
 */

import { prisma } from "@bondery/db";
import { WEBAPP_ROUTES } from "@bondery/helpers";
import { billingIntervalSchema } from "@bondery/schemas";
import { conflictResponse } from "@bondery/schemas/http/responses";
import { EXAMPLE_CHECKOUT_RESPONSE } from "@bondery/schemas/openapi/fixtures/responses";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { FastifyZodOpenApiSchema } from "fastify-zod-openapi";
import { z } from "zod";
import { getAuth } from "../../lib/platform/auth/strategies.js";
import { conflict, forbidden, internal } from "../../lib/platform/errors/http-errors.js";
import { withOkResponse } from "../../lib/platform/openapi/responses.js";
import { getStripeClient } from "../../services/billing/stripe.js";

const checkoutRequestSchema = z.object({
  interval: billingIntervalSchema,
});

const checkoutResponseSchema = z
  .object({
    clientSecret: z.string(),
  })
  .meta({ example: EXAMPLE_CHECKOUT_RESPONSE });

function isBillingUpgradesEnabled(value: string | undefined): boolean {
  return value === "true";
}

function resolvePriceId(
  interval: z.infer<typeof billingIntervalSchema>,
  monthlyPriceId: string,
  annualPriceId: string,
): string {
  return interval === "year" ? annualPriceId : monthlyPriceId;
}

export async function subscriptionCheckoutRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.addHook("onRoute", (routeOptions) => {
    if (routeOptions.schema) {
      routeOptions.schema.tags = ["Subscriptions"];
    }
  });

  fastify.post(
    "/",
    {
      schema: {
        body: checkoutRequestSchema,
        description: "Create a Stripe embedded Checkout session for upgrade.",
        response: {
          ...withOkResponse(checkoutResponseSchema, "Checkout session client secret"),
          ...conflictResponse,
        },
      } satisfies FastifyZodOpenApiSchema,
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!isBillingUpgradesEnabled(fastify.config.BONDERY_PUBLIC_BILLING_UPGRADES_ENABLED)) {
        throw forbidden("Billing upgrades are not enabled", "checkout_not_configured");
      }

      const { user } = getAuth(request);
      const monthlyPriceId = fastify.config.BONDERY_PUBLIC_STRIPE_PRICE_ID_MONTHLY;
      const annualPriceId = fastify.config.BONDERY_PUBLIC_STRIPE_PRICE_ID_ANNUAL;

      if (!monthlyPriceId || !annualPriceId) {
        request.log.error("Stripe price IDs are not configured");
        throw internal("checkout_not_configured");
      }

      const body = checkoutRequestSchema.parse(request.body);
      const priceId = resolvePriceId(body.interval, monthlyPriceId, annualPriceId);

      const existing = await prisma.subscription.findFirst({
        select: { status: true },
        where: { userId: user.id },
      });

      if (existing?.status === "active" || existing?.status === "canceling") {
        throw conflict("AlreadySubscribed", "conflict");
      }

      const returnUrl = `${fastify.config.BONDERY_PUBLIC_WEBAPP_URL}${WEBAPP_ROUTES.SETTINGS}?checkout=success`;

      try {
        const stripe = getStripeClient();
        const session = await stripe.checkout.sessions.create({
          allow_promotion_codes: true,
          customer_email: user.email ?? undefined,
          line_items: [{ price: priceId, quantity: 1 }],
          metadata: {
            bondery_user_id: user.id,
          },
          mode: "subscription",
          return_url: returnUrl,
          subscription_data: {
            metadata: {
              bondery_user_id: user.id,
            },
            trial_period_days: 15,
          },
          ui_mode: "embedded",
        });

        if (!session.client_secret) {
          throw new Error("Stripe checkout session missing client_secret");
        }

        return reply.send({ clientSecret: session.client_secret });
      } catch (err) {
        request.log.error({ err, userId: user.id }, "Failed to create Stripe checkout session");
        throw internal("failed_to_create_checkout_session");
      }
    },
  );
}
