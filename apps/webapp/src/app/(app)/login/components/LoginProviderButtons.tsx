"use client";

import {
  areAllOAuthProvidersDisabled,
  isOAuthProviderEnabled,
} from "@bondery/helpers/auth/oauth-providers";
import { CornerLabeledButton } from "@bondery/mantine-next";
import type { OAuthProviderId, OAuthProvidersBitmap } from "@bondery/schemas/oauth-providers";
import { Stack, Text, Tooltip } from "@mantine/core";
import { IconBrandGithubFilled, IconBrandLinkedin, IconFingerprint } from "@tabler/icons-react";
import type { ComponentType, CSSProperties } from "react";
import { isLastUsedOAuthProvider, isLastUsedPasskey } from "@/lib/auth/last-login-method";
import { useLoginPageTranslations } from "@/lib/i18n/generated/hooks";
import { INTEGRATION_PROVIDERS } from "@/lib/platform/config";
import classes from "./LoginProviderButtons.module.css";

const PROVIDER_ICONS: Record<string, ComponentType<{ size?: number }>> = {
  github: IconBrandGithubFilled,
  linkedin: IconBrandLinkedin,
};

type LoginProviderButtonsProps = {
  getPasskeyTestId?: string;
  getProviderTestId?: (providerKey: string) => string | undefined;
  lastUsedLoginMethod: string | null;
  loading: boolean;
  oauthProviders: OAuthProvidersBitmap | null;
  onPasskeyClick: () => void;
  onProviderClick: (provider: OAuthProviderId) => void;
  showOAuth: boolean;
  showPasskey: boolean;
};

export function LoginProviderButtons({
  getPasskeyTestId,
  getProviderTestId,
  lastUsedLoginMethod,
  loading,
  oauthProviders,
  onPasskeyClick,
  onProviderClick,
  showOAuth,
  showPasskey,
}: LoginProviderButtonsProps) {
  const t = useLoginPageTranslations();
  const passkeyIsLastUsed = showPasskey && isLastUsedPasskey(lastUsedLoginMethod);
  const allOAuthDisabled = showOAuth && areAllOAuthProvidersDisabled(oauthProviders);

  return (
    <Stack gap="xs" w="100%">
      {allOAuthDisabled ? (
        <Text c="dimmed" size="sm" ta="center">
          {t("ProvidersUnavailable")}
        </Text>
      ) : null}

      {showOAuth
        ? INTEGRATION_PROVIDERS.map((provider) => {
            const IconComponent = PROVIDER_ICONS[provider.icon] ?? IconBrandGithubFilled;
            const providerId = provider.provider;
            const enabled = isOAuthProviderEnabled(oauthProviders, providerId);
            const isLastUsed =
              enabled &&
              !passkeyIsLastUsed &&
              isLastUsedOAuthProvider(lastUsedLoginMethod, providerId);
            const unavailableLabel = t("ProviderUnavailable", {
              provider: provider.displayName,
            });

            const button = (
              <CornerLabeledButton
                autoContrast
                className={classes.brandButton}
                color={provider.backgroundColor}
                cornerLabel={isLastUsed ? t("LastUsed") : undefined}
                cornerLabelTestId="login-last-used-badge"
                data-testid={getProviderTestId?.(provider.providerKey)}
                disabled={!enabled}
                fullWidth
                leftSection={<IconComponent size={20} />}
                loading={loading}
                onClick={() => {
                  if (!enabled) {
                    return;
                  }
                  onProviderClick(providerId);
                }}
                size="lg"
                style={
                  {
                    "--login-brand-button-bg": provider.backgroundColor,
                  } as CSSProperties
                }
                variant="filled"
              >
                {t("ContinueWith", { provider: provider.displayName })}
              </CornerLabeledButton>
            );

            if (enabled) {
              return <div key={providerId}>{button}</div>;
            }

            return (
              <Tooltip key={providerId} label={unavailableLabel} maw={360}>
                <span style={{ display: "block", width: "100%" }}>{button}</span>
              </Tooltip>
            );
          })
        : null}

      {showPasskey ? (
        <CornerLabeledButton
          color="branding-primary"
          cornerLabel={passkeyIsLastUsed ? t("LastUsed") : undefined}
          cornerLabelTestId="login-last-used-badge"
          data-testid={getPasskeyTestId}
          fullWidth
          leftSection={<IconFingerprint size={20} />}
          loading={loading}
          onClick={onPasskeyClick}
          size="lg"
          variant="filled"
        >
          {t("ContinueWithPasskey")}
        </CornerLabeledButton>
      ) : null}
    </Stack>
  );
}
