"use client";

import { API_ROUTES } from "@bondery/helpers/globals/paths";
import {
  errorNotificationTemplate,
  successNotificationTemplate,
  warningNotificationTemplate,
} from "@bondery/mantine-next";
import type { SubscriptionStatus } from "@bondery/schemas";
import { useComputedColorScheme } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import type { PolarEmbedCheckout } from "@polar-sh/checkout/embed";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, clientApiJson } from "@/lib/api/client";
import { getSubscriptionStatus, syncSubscription } from "@/lib/api/domains/subscription";
import { isUnauthorizedApiError } from "@/lib/auth/handleUnauthorizedSession";
import { useCheckoutTranslations } from "@/lib/i18n/generated/hooks";
import { invalidateSubscription } from "@/lib/query/invalidation";

/** Maximum ms to wait for the Polar iframe onLoaded event before resetting loading state. */
const IFRAME_LOAD_TIMEOUT_MS = 15_000;

/** Maximum ms to wait for the webhook to update the DB after checkout success. */
const WEBHOOK_CONFIRM_TIMEOUT_MS = 10_000;

const CHECKOUT_POLL_INTERVAL_MS = 800;

interface UseEmbeddedCheckoutOptions {
  /** Optional callback invoked after the checkout `success` event fires. */
  onSuccess?: () => void;
}

interface UseEmbeddedCheckoutResult {
  /** True while the session is being created or the iframe is loading. */
  isLoading: boolean;
  /** Opens the embedded Polar checkout overlay. */
  openCheckout: () => Promise<void>;
}

function isCheckoutConfirmed(status: SubscriptionStatus | null): boolean {
  return status?.plan === "premium";
}

async function waitForCheckoutConfirmation(
  cancelled: () => boolean,
): Promise<"confirmed" | "timeout"> {
  const started = Date.now();

  try {
    await syncSubscription();
  } catch {
    // Polar webhook may still land; keep polling GET /api/subscriptions.
  }

  while (Date.now() - started < WEBHOOK_CONFIRM_TIMEOUT_MS) {
    if (cancelled()) {
      return "timeout";
    }

    try {
      const status = await getSubscriptionStatus();
      if (isCheckoutConfirmed(status)) {
        return "confirmed";
      }
    } catch {
      // Transient errors during webhook propagation — retry until timeout.
    }

    await new Promise((resolve) => setTimeout(resolve, CHECKOUT_POLL_INTERVAL_MS));
  }

  return "timeout";
}

/**
 * Hook that creates a Polar checkout session and opens it as an in-app iframe overlay.
 *
 * Flow:
 *  1. POST /api/subscriptions/checkout → get session URL (409 = already subscribed)
 *  2. PolarEmbedCheckout.create(url) → iframe overlay appears
 *  3. `success` event → poll GET /api/subscriptions until premium is confirmed
 *  4. When plan is premium → show success notification, call onSuccess, router.refresh()
 *  5. If polling times out → show pending notification
 *  6. `close` event → clean up instance ref, reset loading state
 *
 * @param options.onSuccess Optional callback invoked when the DB confirms the upgrade.
 */
export function useEmbeddedCheckout({
  onSuccess,
}: UseEmbeddedCheckoutOptions = {}): UseEmbeddedCheckoutResult {
  const [isLoading, setIsLoading] = useState(false);
  const checkoutRef = useRef<InstanceType<typeof PolarEmbedCheckout> | null>(null);
  const confirmationCancelledRef = useRef(false);
  const router = useRouter();
  const queryClient = useQueryClient();
  const colorScheme = useComputedColorScheme("light");
  const t = useCheckoutTranslations();

  const handleCheckoutConfirmed = useCallback(() => {
    void invalidateSubscription(queryClient);
    onSuccess?.();
    router.refresh();
  }, [onSuccess, queryClient, router]);

  useEffect(() => {
    return () => {
      confirmationCancelledRef.current = true;
      if (checkoutRef.current) {
        checkoutRef.current.close();
        checkoutRef.current = null;
      }
    };
  }, []);

  const openCheckout = useCallback(async () => {
    setIsLoading(true);
    confirmationCancelledRef.current = false;

    let url: string;
    try {
      const checkoutSession = await clientApiJson<{ url: string }>(
        API_ROUTES.SUBSCRIPTIONS_CHECKOUT,
        { method: "POST" },
      );
      url = checkoutSession.url;
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

    const { PolarEmbedCheckout } = await import("@polar-sh/checkout/embed");

    let checkout: InstanceType<typeof PolarEmbedCheckout>;

    const iframeLoadTimeout = setTimeout(() => {
      setIsLoading(false);
    }, IFRAME_LOAD_TIMEOUT_MS);

    try {
      checkout = await PolarEmbedCheckout.create(url, {
        onLoaded: () => {
          clearTimeout(iframeLoadTimeout);
          setIsLoading(false);
        },
        theme: colorScheme === "dark" ? "dark" : "light",
      });
    } catch {
      clearTimeout(iframeLoadTimeout);
      notifications.show(
        errorNotificationTemplate({
          description: t("errorMessage"),
          title: t("errorTitle"),
        }),
      );
      setIsLoading(false);
      return;
    }

    checkoutRef.current = checkout;

    checkout.addEventListener("success", () => {
      void (async () => {
        const result = await waitForCheckoutConfirmation(
          () => confirmationCancelledRef.current,
        );

        if (confirmationCancelledRef.current) {
          return;
        }

        checkout.close();

        if (result === "confirmed") {
          notifications.show(
            successNotificationTemplate({
              description: t("successMessage"),
              title: t("successTitle"),
            }),
          );
        } else {
          notifications.show(
            warningNotificationTemplate({
              description: t("upgradePendingMessage"),
              title: t("upgradePendingTitle"),
            }),
          );
        }

        handleCheckoutConfirmed();
      })();
    });

    checkout.addEventListener("close", () => {
      confirmationCancelledRef.current = true;
      checkoutRef.current = null;
      clearTimeout(iframeLoadTimeout);
      setIsLoading(false);
    });
  }, [colorScheme, handleCheckoutConfirmed, t]);

  return { isLoading, openCheckout };
}
