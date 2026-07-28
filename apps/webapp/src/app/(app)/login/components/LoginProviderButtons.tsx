"use client";

import { Badge, Button, Stack } from "@mantine/core";
import { IconBrandGithubFilled, IconBrandLinkedin } from "@tabler/icons-react";
import { useEffect, useMemo, useState } from "react";
import type { WebappAuthClient } from "@/lib/auth/client";
import { useLoginPageTranslations } from "@/lib/i18n/generated/hooks";
import { INTEGRATION_PROVIDERS } from "@/lib/platform/config";

const PROVIDER_ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
  github: IconBrandGithubFilled,
  linkedin: IconBrandLinkedin,
};

type OAuthProvider = "github" | "linkedin";

type LoginProviderButtonsProps = {
  authClient: WebappAuthClient;
  getProviderTestId?: (providerKey: string) => string | undefined;
  loading: boolean;
  onProviderClick: (provider: OAuthProvider) => void;
};

export function LoginProviderButtons({
  authClient,
  getProviderTestId,
  loading,
  onProviderClick,
}: LoginProviderButtonsProps) {
  const t = useLoginPageTranslations();
  const [lastMethod, setLastMethod] = useState<string | null>(null);

  const activeProviders = useMemo(
    () =>
      INTEGRATION_PROVIDERS.filter((provider) => provider.active).sort((a, b) => {
        if (a.providerKey === "linkedin" && b.providerKey !== "linkedin") {
          return -1;
        }
        if (b.providerKey === "linkedin" && a.providerKey !== "linkedin") {
          return 1;
        }
        return 0;
      }),
    [],
  );

  const activeProviderKeys = useMemo(
    () => new Set<string>(activeProviders.map((provider) => provider.providerKey)),
    [activeProviders],
  );

  useEffect(() => {
    setLastMethod(authClient.getLastUsedLoginMethod());
  }, [authClient]);

  const showLastUsedBadge =
    lastMethod !== null && activeProviderKeys.has(lastMethod);

  return (
    <Stack gap="xs" w="100%">
      {activeProviders.map((provider) => {
        const IconComponent = PROVIDER_ICONS[provider.icon] ?? IconBrandGithubFilled;
        const isLastUsed = showLastUsedBadge && lastMethod === provider.providerKey;

        return (
          <Button
            color={provider.backgroundColor}
            data-testid={getProviderTestId?.(provider.providerKey)}
            fullWidth
            key={provider.provider}
            leftSection={<IconComponent size={20} />}
            loading={loading}
            onClick={() => onProviderClick(provider.providerKey as OAuthProvider)}
            rightSection={
              isLastUsed ? (
                <Badge
                  color="gray"
                  data-testid="login-last-used-badge"
                  size="sm"
                  variant="light"
                >
                  {t("LastUsed")}
                </Badge>
              ) : undefined
            }
            size="lg"
          >
            {t("ContinueWith", { provider: provider.displayName })}
          </Button>
        );
      })}
    </Stack>
  );
}
