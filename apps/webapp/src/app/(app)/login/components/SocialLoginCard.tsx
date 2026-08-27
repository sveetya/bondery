"use client";

import { WEBSITE_ROUTES } from "@bondery/helpers/globals/paths";
import { AnchorLink } from "@bondery/mantine-next";
import { Stack, Text, Title } from "@mantine/core";
import { useLoginPageTranslations } from "@/lib/i18n/generated/hooks";
import { TypedTrans } from "@/lib/i18n/TypedTrans";
import { LoginBrandShell } from "./LoginBrandShell";
import { LoginProviderButtons } from "./LoginProviderButtons";

type OAuthProvider = "github" | "linkedin";

type SocialLoginCardProps = {
  getProviderTestId?: (providerKey: string) => string | undefined;
  lastUsedLoginMethod: string | null;
  loading: boolean;
  onProviderClick: (provider: OAuthProvider) => void;
  websiteUrl: string;
};

export function SocialLoginCard({
  getProviderTestId,
  lastUsedLoginMethod,
  loading,
  onProviderClick,
  websiteUrl,
}: SocialLoginCardProps) {
  const t = useLoginPageTranslations();

  return (
    <LoginBrandShell websiteUrl={websiteUrl}>
      <Stack gap="lg">
        <Stack gap={6}>
          <Title fw={700} fz="h2" lh={1.15} order={2}>
            {t("FormTitle")}
          </Title>
          <Text c="dimmed" size="md">
            {t("Description")}
          </Text>
        </Stack>

        <LoginProviderButtons
          getProviderTestId={getProviderTestId}
          lastUsedLoginMethod={lastUsedLoginMethod}
          loading={loading}
          onProviderClick={onProviderClick}
        />
        <Text c="dimmed" size="xs">
          <TypedTrans
            components={{
              privacyLink: (
                <AnchorLink href={`${websiteUrl}${WEBSITE_ROUTES.PRIVACY}`} size="xs">
                  {null}
                </AnchorLink>
              ),
              termsLink: (
                <AnchorLink href={`${websiteUrl}${WEBSITE_ROUTES.TERMS}`} size="xs">
                  {null}
                </AnchorLink>
              ),
            }}
            i18nKey="TermsText"
            t={t}
          />
        </Text>
      </Stack>
    </LoginBrandShell>
  );
}
