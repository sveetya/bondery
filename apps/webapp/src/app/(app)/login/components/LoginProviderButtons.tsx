"use client";

import { CornerLabeledButton } from "@bondery/mantine-next";
import { Stack } from "@mantine/core";
import { IconBrandGithubFilled, IconBrandLinkedin } from "@tabler/icons-react";
import { useMemo } from "react";
import { useLoginPageTranslations } from "@/lib/i18n/generated/hooks";
import { INTEGRATION_PROVIDERS } from "@/lib/platform/config";

const PROVIDER_ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
  github: IconBrandGithubFilled,
  linkedin: IconBrandLinkedin,
};

type OAuthProvider = "github" | "linkedin";

type LoginProviderButtonsProps = {
  getProviderTestId?: (providerKey: string) => string | undefined;
  lastUsedLoginMethod: string | null;
  loading: boolean;
  onProviderClick: (provider: OAuthProvider) => void;
};

export function LoginProviderButtons({
  getProviderTestId,
  lastUsedLoginMethod,
  loading,
  onProviderClick,
}: LoginProviderButtonsProps) {
  const t = useLoginPageTranslations();

  const activeProviders = useMemo(
    () =>
      INTEGRATION_PROVIDERS.filter((provider) => provider.active).sort((a, b) => {
        if (a.provider === "linkedin" && b.provider !== "linkedin") {
          return -1;
        }
        if (b.provider === "linkedin" && a.provider !== "linkedin") {
          return 1;
        }
        return 0;
      }),
    [],
  );

  return (
    <Stack gap="xs" w="100%">
      {activeProviders.map((provider) => {
        const IconComponent = PROVIDER_ICONS[provider.icon] ?? IconBrandGithubFilled;
        const isLastUsed = lastUsedLoginMethod === provider.provider;

        return (
          <CornerLabeledButton
            color={provider.backgroundColor}
            cornerLabel={isLastUsed ? t("LastUsed") : undefined}
            cornerLabelTestId="login-last-used-badge"
            data-testid={getProviderTestId?.(provider.providerKey)}
            fullWidth
            key={provider.provider}
            leftSection={<IconComponent size={20} />}
            loading={loading}
            onClick={() => onProviderClick(provider.provider as OAuthProvider)}
            size="lg"
          >
            {t("ContinueWith", { provider: provider.displayName })}
          </CornerLabeledButton>
        );
      })}
    </Stack>
  );
}
