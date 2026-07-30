"use client";

import { getAuthUserFacingError } from "@bondery/helpers/api";
import { errorNotificationTemplate } from "@bondery/mantine-next";
import { notifications } from "@mantine/notifications";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { createWebappAuthClient } from "@/lib/auth/client";
import { setLocalePreferencesCookie } from "@/lib/auth/detectLocale";
import { RETURN_INTENT_PARAM } from "@/lib/auth/returnIntent";
import { useCommonTranslations, useLoginPageTranslations } from "@/lib/i18n/generated/hooks";
import { useWebappRuntimeConfig } from "@/lib/platform/runtimeConfig.client";
import { SocialLoginCard } from "./components/SocialLoginCard";

export function LoginClient() {
  const t = useLoginPageTranslations();
  const tCommon = useCommonTranslations();
  const [loading, setLoading] = useState(false);
  const runtimeConfig = useWebappRuntimeConfig();
  const authClient = useMemo(() => createWebappAuthClient(runtimeConfig), [runtimeConfig]);
  const searchParams = useSearchParams();
  const { websiteUrl } = runtimeConfig;

  const redirectParam = searchParams.get(RETURN_INTENT_PARAM);
  const shouldForceDesktopLoginLayout = redirectParam?.startsWith("/oauth/consent") ?? false;

  const handleOAuthLogin = async (provider: "github" | "linkedin") => {
    try {
      setLoading(true);
      await setLocalePreferencesCookie();

      // Establish the API's native Better Auth session via social sign-in
      // first, then resume the webapp's OAuth-BFF exchange. Starting at
      // /auth/start without a native session stops on /oauth/login and forces
      // a second provider click.
      const callbackURL =
        redirectParam?.startsWith("/oauth/consent") === true
          ? new URL(redirectParam, window.location.origin).toString()
          : (() => {
              const startUrl = new URL("/auth/start", window.location.origin);
              if (redirectParam) {
                startUrl.searchParams.set(RETURN_INTENT_PARAM, redirectParam);
              }
              return startUrl.toString();
            })();

      const { error } = await authClient.signIn.social({
        callbackURL,
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
      getProviderTestId={(providerKey) =>
        providerKey === "github" ? "login-github" : `login-${providerKey}`
      }
      hideOnMobile={!shouldForceDesktopLoginLayout}
      loading={loading}
      onProviderClick={handleOAuthLogin}
      websiteUrl={websiteUrl}
    />
  );
}
