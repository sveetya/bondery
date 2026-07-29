"use client";

import { API_ROUTES } from "@bondery/helpers/globals/paths";
import {
  errorNotificationTemplate,
  successNotificationTemplate,
  warningNotificationTemplate,
} from "@bondery/mantine-next";
import type { SubscriptionStatus } from "@bondery/schemas";
import { notifications } from "@mantine/notifications";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, clientApiJson } from "@/lib/api/client";
import { getSubscriptionStatus } from "@/lib/api/domains/subscription";
import { isUnauthorizedApiError } from "@/lib/auth/handleUnauthorizedSession";
import { useCheckoutTranslations } from "@/lib/i18n/generated/hooks";
import { useWebappRuntimeConfig } from "@/lib/platform/runtimeConfig.client";
import { invalidateSubscription } from "@/lib/query/invalidation";

const CHECKOUT_POLL_INTERVAL_MS = 800;
const WEBHOOK_CONFIRM_TIMEOUT_MS = 10_000;

interface UseEmbeddedCheckoutOptions {
  checkoutMountId: string;
  onSuccess?: () => void;
}

interface UseEmbeddedCheckoutResult {
  closeCheckout: () => void;
  isLoading: boolean;
  isModalOpen: boolean;
  openCheckout: () => Promise<void>;
}

function isCheckoutConfirmed(status: SubscriptionStatus | null): boolean {
  return status?.plan === "premium";
}

export function useEmbeddedCheckout({
  checkoutMountId,
  onSuccess,
}: UseEmbeddedCheckoutOptions): UseEmbeddedCheckoutResult {
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const checkoutRef = useRef<{ destroy: () => void } | null>(null);
  const pollTimerRef = useRef<number | null>(null);
  const confirmationCancelledRef = useRef(false);
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useCheckoutTranslations();
  const { stripePublishableKey } = useWebappRuntimeConfig();

  const handleCheckoutConfirmed = useCallback(() => {
    void invalidateSubscription(queryClient);
    onSuccess?.();
    router.refresh();
  }, [onSuccess, queryClient, router]);

  const closeCheckout = useCallback(() => {
    confirmationCancelledRef.current = true;
    if (pollTimerRef.current != null) {
      window.clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    checkoutRef.current?.destroy();
    checkoutRef.current = null;
    setIsModalOpen(false);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    return () => {
      closeCheckout();
    };
  }, [closeCheckout]);

  const openCheckout = useCallback(async () => {
    if (!stripePublishableKey) {
      notifications.show(
        errorNotificationTemplate({
          description: t("errorMessage"),
          title: t("errorTitle"),
        }),
      );
      return;
    }

    setIsLoading(true);
    confirmationCancelledRef.current = false;

    let clientSecret: string;
    try {
      const checkoutSession = await clientApiJson<{ clientSecret: string }>(
        API_ROUTES.SUBSCRIPTIONS_CHECKOUT,
        {
          headers: { "Content-Type": "application/json" },
          method: "POST",
        },
      );
      clientSecret = checkoutSession.clientSecret;
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        notifications.show(
          warningNotificationTemplate({
            description: t("alreadySubscribedMessage"),
            title: t("alreadySubscribedTitle"),
          }),
        );
        setIsLoading(false);
        return;
      }

      if (isUnauthorizedApiError(error)) {
        setIsLoading(false);
        return;
      }

      notifications.show(
        errorNotificationTemplate({
          description: t("errorMessage"),
          title: t("errorTitle"),
        }),
      );
      setIsLoading(false);
      return;
    }

    const { loadStripe } = await import("@stripe/stripe-js");
    const stripe = await loadStripe(stripePublishableKey);

    if (!stripe) {
      notifications.show(
        errorNotificationTemplate({
          description: t("errorMessage"),
          title: t("errorTitle"),
        }),
      );
      setIsLoading(false);
      return;
    }

    setIsModalOpen(true);
    await new Promise((resolve) => requestAnimationFrame(resolve));

    try {
      const checkout = await stripe.createEmbeddedCheckoutPage({ clientSecret });
      checkoutRef.current = checkout;
      checkout.mount(`#${checkoutMountId}`);
      setIsLoading(false);

      const started = Date.now();
      pollTimerRef.current = window.setInterval(() => {
        void (async () => {
          if (confirmationCancelledRef.current) {
            return;
          }

          if (Date.now() - started > WEBHOOK_CONFIRM_TIMEOUT_MS) {
            return;
          }

          try {
            const status = await getSubscriptionStatus();
            if (!isCheckoutConfirmed(status)) {
              return;
            }

            closeCheckout();
            notifications.show(
              successNotificationTemplate({
                description: t("successMessage"),
                title: t("successTitle"),
              }),
            );
            handleCheckoutConfirmed();
          } catch {
            // Keep polling while checkout is open.
          }
        })();
      }, CHECKOUT_POLL_INTERVAL_MS);
    } catch {
      closeCheckout();
      notifications.show(
        errorNotificationTemplate({
          description: t("errorMessage"),
          title: t("errorTitle"),
        }),
      );
    }
  }, [checkoutMountId, closeCheckout, handleCheckoutConfirmed, stripePublishableKey, t]);

  return { closeCheckout, isLoading, isModalOpen, openCheckout };
}
