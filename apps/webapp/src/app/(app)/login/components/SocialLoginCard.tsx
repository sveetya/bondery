"use client";

import { WEBSITE_ROUTES } from "@bondery/helpers/globals/paths";
import { AnchorLink } from "@bondery/mantine-next";
import { Card, Stack, Text } from "@mantine/core";
import type { WebappAuthClient } from "@/lib/auth/client";
import { useLoginPageTranslations } from "@/lib/i18n/generated/hooks";
import { TypedTrans } from "@/lib/i18n/TypedTrans";
import { LoginProviderButtons } from "./LoginProviderButtons";
import { Logo } from "./Logo";

type OAuthProvider = "github" | "linkedin";

type SocialLoginCardProps = {
  authClient: WebappAuthClient;
  getProviderTestId?: (providerKey: string) => string | undefined;
  /** When true, small viewports show a desktop-only message instead of sign-in buttons. */
  hideOnMobile?: boolean;
  loading: boolean;
  onProviderClick: (provider: OAuthProvider) => void;
  websiteUrl: string;
};

export function SocialLoginCard({
  authClient,
  getProviderTestId,
  hideOnMobile = false,
  loading,
  onProviderClick,
  websiteUrl,
}: SocialLoginCardProps) {
  const t = useLoginPageTranslations();

  return (
    <div className="flex min-h-screen items-center justify-center ">
      <Card className="max-w-md" p="xl">
        {hideOnMobile ? (
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
        ) : null}
        <Stack align="center" gap="md" {...(hideOnMobile ? { visibleFrom: "sm" } : {})}>
          <Logo href={websiteUrl} size={60} />
          <Text size="md" ta="center">
            {t("Description")}
          </Text>

          <LoginProviderButtons
            authClient={authClient}
            getProviderTestId={getProviderTestId}
            loading={loading}
            onProviderClick={onProviderClick}
          />
          <Text c="dimmed" size="xs" ta="center">
            <TypedTrans
              components={{
                privacyLink: (
                  <AnchorLink href={`${websiteUrl}${WEBSITE_ROUTES.PRIVACY}`} size="xs" />
                ),
                termsLink: <AnchorLink href={`${websiteUrl}${WEBSITE_ROUTES.TERMS}`} size="xs" />,
              }}
              i18nKey="TermsText"
              t={t}
            />
          </Text>
        </Stack>
      </Card>
    </div>
  );
}
