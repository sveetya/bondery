"use client";

import { WEBSITE_ROUTES } from "@bondery/helpers/globals/paths";
import { AnchorLink } from "@bondery/mantine-next";
import type { OAuthProviderId, OAuthProvidersBitmap } from "@bondery/schemas/oauth-providers";
import { Stack, Text, Title } from "@mantine/core";
import { useEffect, useState } from "react";
import { isWebAuthnSupported } from "@/lib/auth/passkey-support";
import { useLoginPageTranslations } from "@/lib/i18n/generated/hooks";
import { TypedTrans } from "@/lib/i18n/TypedTrans";
import { LoginBrandShell } from "./LoginBrandShell";
import { LoginProviderButtons } from "./LoginProviderButtons";

type SocialLoginCardProps = {
  getPasskeyTestId?: string;
  getProviderTestId?: (providerKey: string) => string | undefined;
  lastUsedLoginMethod: string | null;
  loading: boolean;
  oauthProviders: OAuthProvidersBitmap | null;
  onPasskeyClick: () => void;
  onProviderClick: (provider: OAuthProviderId) => void;
  websiteUrl: string;
};

export function SocialLoginCard({
  getPasskeyTestId,
  getProviderTestId,
  lastUsedLoginMethod,
  loading,
  oauthProviders,
  onPasskeyClick,
  onProviderClick,
  websiteUrl,
}: SocialLoginCardProps) {
  const t = useLoginPageTranslations();
  // Optimistic so SSR and the first client paint include the passkey button.
  // `useState(() => isWebAuthnSupported())` hydrates `false` (no `window` on
  // the server) and flashes OAuth-only until the effect runs.
  const [passkeySupported, setPasskeySupported] = useState(true);

  useEffect(() => {
    setPasskeySupported(isWebAuthnSupported());
  }, []);

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
          getPasskeyTestId={getPasskeyTestId}
          getProviderTestId={getProviderTestId}
          lastUsedLoginMethod={lastUsedLoginMethod}
          loading={loading}
          oauthProviders={oauthProviders}
          onPasskeyClick={onPasskeyClick}
          onProviderClick={onProviderClick}
          showOAuth
          showPasskey={passkeySupported}
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
