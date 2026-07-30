"use client";

import { getAuthUserFacingError } from "@bondery/helpers/api";
import { WEBAPP_ROUTES } from "@bondery/helpers/globals/paths";
import { errorNotificationTemplate } from "@bondery/mantine-next";
import { notifications } from "@mantine/notifications";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { SocialLoginCard } from "@/app/(app)/login/components/SocialLoginCard";
import { createWebappAuthClient } from "@/lib/auth/client";
import { setLocalePreferencesCookie } from "@/lib/auth/detectLocale";
import { useCommonTranslations, useLoginPageTranslations } from "@/lib/i18n/generated/hooks";
import { useWebappRuntimeConfig } from "@/lib/platform/runtimeConfig.client";

/**
 * Authorization-server login gate — see page.tsx for why this is deliberately
 * independent of the webapp's own session. Always shows the sign-in buttons;
 * never redirects based on any pre-existing webapp state.
 */
export function OAuthLoginClient() {
  const t = useLoginPageTranslations();
  const tCommon = useCommonTranslations();
  const [loading, setLoading] = useState(false);
  const runtimeConfig = useWebappRuntimeConfig();
  const authClient = useMemo(() => createWebappAuthClient(runtimeConfig), [runtimeConfig]);
  const searchParams = useSearchParams();
  const { webappUrl, websiteUrl } = runtimeConfig;
  const oauthError = searchParams.get("error");
  const shownOAuthErrorRef = useRef<string | null>(null);

  useEffect(() => {
    if (!oauthError || shownOAuthErrorRef.current === oauthError) {
      return;
    }

    shownOAuthErrorRef.current = oauthError;
    notifications.show(
      errorNotificationTemplate({
        description: getAuthUserFacingError({ code: oauthError }, tCommon),
        title: t("AuthenticationError"),
      }),
    );
  }, [oauthError, t, tCommon]);

  const handleOAuthLogin = async (provider: "github" | "linkedin") => {
    try {
      setLoading(true);

      await setLocalePreferencesCookie();

      // No `redirect`/`oauth_query` param is built here: the current
      // page's query string already carries Better Auth's own signed
      // continuation (forwarded verbatim from /oauth/consent, or set
      // directly by the AS's /oauth2/authorize redirect). The
      // `oauthProviderClient()` plugin on this client automatically reads
      // `window.location.search` and attaches it as `oauth_query`, so once
      // sign-in completes, Better Auth resumes the original authorization
      // transaction instead of following `callbackURL` below — that URL is
      // only a fallback for the (invalid) case of landing here without one.
      const { error } = await authClient.signIn.social({
        callbackURL: `${webappUrl.replace(/\/$/, "")}${WEBAPP_ROUTES.HOME}`,
        provider,
      });

      if (error) {
        notifications.show(
          errorNotificationTemplate({
            description: getAuthUserFacingError(error, tCommon),
            title: t("AuthenticationError"),
          }),
        );
      }
    } catch (err) {
      notifications.show(
        errorNotificationTemplate({
          description: getAuthUserFacingError(err, tCommon),
          title: t("UnexpectedError"),
        }),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SocialLoginCard
      authClient={authClient}
      loading={loading}
      onProviderClick={handleOAuthLogin}
      websiteUrl={websiteUrl}
    />
  );
}
