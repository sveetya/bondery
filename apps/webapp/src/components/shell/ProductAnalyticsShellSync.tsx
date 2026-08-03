"use client";

import { useEffect, useRef } from "react";
import { applyPostHogConsentState, captureEvent, posthog } from "@/lib/analytics/client";
import { createWebappAuthClient } from "@/lib/auth/client";
import { useSettingsQuery } from "@/lib/query/hooks/useSettings";

const SESSION_CREATE_KEY = "bondery:auth:session_create_fired";

/**
 * Wires PostHog identity, consent, and session lifecycle events after shell load.
 */
export function ProductAnalyticsShellSync() {
  const { data: settingsResult } = useSettingsQuery();
  const identifiedUserIdRef = useRef<string | null>(null);

  const productAnalyticsEnabled = settingsResult?.data?.productAnalyticsEnabled !== false;

  useEffect(() => {
    applyPostHogConsentState(productAnalyticsEnabled);
  }, [productAnalyticsEnabled]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const authClient = createWebappAuthClient();
      const session = await authClient.getSession();
      const userId = session.data?.user?.id;

      if (!userId || cancelled || !posthog.__loaded) {
        return;
      }

      if (identifiedUserIdRef.current !== userId) {
        posthog.identify(userId);
        identifiedUserIdRef.current = userId;
      }

      if (typeof window !== "undefined" && !sessionStorage.getItem(SESSION_CREATE_KEY)) {
        captureEvent("auth:session_create");
        sessionStorage.setItem(SESSION_CREATE_KEY, "1");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
