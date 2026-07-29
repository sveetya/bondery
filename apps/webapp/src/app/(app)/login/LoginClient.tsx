"use client";

import { WEBSITE_ROUTES } from "@bondery/helpers/globals/paths";
import { AnchorLink, errorNotificationTemplate } from "@bondery/mantine-next";
import { Card, Stack, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { createWebappAuthClient } from "@/lib/auth/client";
import { setLocalePreferencesCookie } from "@/lib/auth/detectLocale";
import { RETURN_INTENT_PARAM } from "@/lib/auth/returnIntent";
import { useCommonTranslations, useLoginPageTranslations } from "@/lib/i18n/generated/hooks";
import { useWebappRuntimeConfig } from "@/lib/platform/runtimeConfig.client";
import { LoginProviderButtons } from "./components/LoginProviderButtons";
import { Logo } from "./components/Logo";

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

  const handleOAuthLogin = async (_provider: "github" | "linkedin") => {
    try {
      setLoading(true);
      await setLocalePreferencesCookie();

      const startUrl = new URL("/auth/start", window.location.origin);
      if (redirectParam) {
        startUrl.searchParams.set(RETURN_INTENT_PARAM, redirectParam);
      }

      window.location.assign(startUrl.toString());
    } catch (_err) {
      notifications.show(
        errorNotificationTemplate({
          description: tCommon("errors.unknown"),
          title: t("UnexpectedError"),
        }),
      );
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center ">
      <Card className="max-w-md" p="xl">
        {!shouldForceDesktopLoginLayout && (
          <Stack align="center" gap="lg" hiddenFrom="sm">
            <Logo href={websiteUrl} size={60} />
            <Stack align="center" gap="0">
              <Text fw={600} size="lg" ta="center">
                {t("MobileNotAvailable")}
              </Text>
              <Text c="dimmed" size="md" ta="center">
                {t("MobileNotAvailableMessage")}
              </Text>
            </Stack>
          </Stack>
        )}
        <Stack
          align="center"
          gap="md"
          {...(!shouldForceDesktopLoginLayout ? { visibleFrom: "sm" } : {})}
        >
          <Logo href={websiteUrl} size={60} />
          <Text size="md" ta="center">
            {t("Description")}
          </Text>

          <LoginProviderButtons
            authClient={authClient}
            getProviderTestId={(providerKey) =>
              providerKey === "github" ? "login-github" : `login-${providerKey}`
            }
            loading={loading}
            onProviderClick={handleOAuthLogin}
          />
          <Text c="dimmed" size="xs" ta="center">
            {t("TermsAgreement")}{" "}
            <AnchorLink href={`${websiteUrl}${WEBSITE_ROUTES.TERMS}`} size="xs">
              {t("TermsOfService")}
            </AnchorLink>{" "}
            {t("And")}{" "}
            <AnchorLink href={`${websiteUrl}${WEBSITE_ROUTES.PRIVACY}`} size="xs">
              {t("PrivacyPolicy")}
            </AnchorLink>
          </Text>
        </Stack>
      </Card>
    </div>
  );
}
