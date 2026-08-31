import {
  areAllOAuthProvidersDisabled,
  isOAuthProviderEnabled,
  parseOAuthProvidersResponse,
} from "@bondery/helpers/auth/oauth-providers";
import { API_ROUTES, WEBSITE_ROUTES } from "@bondery/helpers/globals/paths";
import type { OAuthProvidersBitmap } from "@bondery/schemas/oauth-providers";
import { IconBrandGithub, IconBrandLinkedin } from "@tabler/icons-react-native";
import { useEffect, useState } from "react";
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { useLoginPageTranslations, useMobileAuthTranslations } from "@/lib/i18n/generated/hooks";
import { authClient } from "../../src/lib/auth/client";
import { API_URL, MOBILE_OPACITY, WEBSITE_URL } from "../../src/lib/config";
import { preloadMobileNamespaces } from "../../src/lib/i18n/preloadMobileNamespaces";
import { OAUTH_PROVIDER_COLORS } from "../../src/theme/colors";
import { MOBILE_TYPOGRAPHY } from "../../src/theme/tokens";
import { useMobileThemeColors } from "../../src/theme/useMobileThemeColors";

type Provider = "github" | "linkedin";

const PROVIDERS: Array<{
  provider: Provider;
  labelKey: "Providers.GitHub" | "Providers.LinkedIn";
  Icon: typeof IconBrandGithub;
  backgroundColor: string;
  pressedBackgroundColor: string;
  textColor: string;
}> = [
  {
    backgroundColor: OAUTH_PROVIDER_COLORS.github.background,
    Icon: IconBrandGithub,
    labelKey: "Providers.GitHub",
    pressedBackgroundColor: OAUTH_PROVIDER_COLORS.github.backgroundPress,
    provider: "github",
    textColor: OAUTH_PROVIDER_COLORS.github.text,
  },
  {
    backgroundColor: OAUTH_PROVIDER_COLORS.linkedin.background,
    Icon: IconBrandLinkedin,
    labelKey: "Providers.LinkedIn",
    pressedBackgroundColor: OAUTH_PROVIDER_COLORS.linkedin.backgroundPress,
    provider: "linkedin",
    textColor: OAUTH_PROVIDER_COLORS.linkedin.text,
  },
];

async function fetchOAuthProvidersBitmap(): Promise<OAuthProvidersBitmap | null> {
  if (!API_URL) {
    return null;
  }

  try {
    const response = await fetch(`${API_URL}${API_ROUTES.OAUTH_PROVIDERS}`, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) {
      return null;
    }
    return parseOAuthProvidersResponse(await response.json());
  } catch {
    return null;
  }
}

export default function LoginScreen() {
  const colors = useMobileThemeColors();
  const tLoginPage = useLoginPageTranslations();
  const tMobileAuth = useMobileAuthTranslations();
  const [loadingProvider, setLoadingProvider] = useState<Provider | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [oauthProviders, setOAuthProviders] = useState<OAuthProvidersBitmap | null>(null);

  useEffect(() => {
    void preloadMobileNamespaces(["mobile.auth"]);
  }, []);

  useEffect(() => {
    let cancelled = false;

    void fetchOAuthProvidersBitmap().then((bitmap) => {
      if (!cancelled) {
        setOAuthProviders(bitmap);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const allOAuthDisabled = areAllOAuthProvidersDisabled(oauthProviders);

  const startOAuth = async (provider: Provider) => {
    if (!isOAuthProviderEnabled(oauthProviders, provider)) {
      return;
    }

    if (!authClient) {
      setError(tMobileAuth("MissingConfig"));
      return;
    }

    setError(null);
    setLoadingProvider(provider);

    try {
      const { error: signInError } = await authClient.signIn.social({
        callbackURL: "bondery://auth/callback",
        provider,
      });

      if (signInError) {
        throw new Error(signInError.message);
      }
    } catch (oauthError) {
      setError(
        oauthError instanceof Error ? oauthError.message : tLoginPage("UnexpectedErrorMessage"),
      );
    } finally {
      setLoadingProvider(null);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.appBackground }]}>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.logo, { color: colors.textPrimary }]}>Bondery</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {tLoginPage("Description")}
        </Text>

        {allOAuthDisabled ? (
          <Text style={[styles.unavailableText, { color: colors.textMuted }]}>
            {tLoginPage("ProvidersUnavailable")}
          </Text>
        ) : null}

        <View style={styles.providers}>
          {PROVIDERS.map(
            ({ provider, labelKey, Icon, backgroundColor, pressedBackgroundColor, textColor }) => {
              const isLoading = loadingProvider === provider;
              const enabled = isOAuthProviderEnabled(oauthProviders, provider);
              const unavailableLabel = tLoginPage("ProviderUnavailable", {
                provider: tLoginPage(labelKey),
              });

              return (
                <View key={provider}>
                  <Pressable
                    accessibilityHint={enabled ? undefined : unavailableLabel}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: !enabled || Boolean(loadingProvider) }}
                    disabled={!enabled || Boolean(loadingProvider)}
                    onPress={() => startOAuth(provider)}
                    style={({ pressed }) => [
                      styles.providerButton,
                      {
                        backgroundColor: pressed ? pressedBackgroundColor : backgroundColor,
                        opacity: enabled ? 1 : MOBILE_OPACITY.disabled,
                      },
                      Boolean(loadingProvider) && enabled && styles.providerButtonDisabled,
                    ]}
                  >
                    <View style={styles.providerContent}>
                      <View style={styles.providerIconSection}>
                        {isLoading ? (
                          <ActivityIndicator color={textColor} size="small" />
                        ) : (
                          <Icon color={textColor} size={18} />
                        )}
                      </View>
                      <Text style={[styles.providerText, { color: textColor }]}>
                        {tLoginPage("ContinueWith").replace("{provider}", tLoginPage(labelKey))}
                      </Text>
                    </View>
                  </Pressable>
                  {!enabled && !allOAuthDisabled ? (
                    <Text style={[styles.unavailableText, { color: colors.textMuted }]}>
                      {unavailableLabel}
                    </Text>
                  ) : null}
                </View>
              );
            },
          )}
        </View>

        <Text style={[styles.termsText, { color: colors.textMuted }]}>
          {tLoginPage("TermsAgreement")}{" "}
          <Text
            onPress={() => Linking.openURL(`${WEBSITE_URL}${WEBSITE_ROUTES.TERMS}`)}
            style={[styles.link, { color: colors.primary }]}
          >
            {tLoginPage("TermsOfService")}
          </Text>{" "}
          {tLoginPage("And")}{" "}
          <Text
            onPress={() => Linking.openURL(`${WEBSITE_URL}${WEBSITE_ROUTES.PRIVACY}`)}
            style={[styles.link, { color: colors.primary }]}
          >
            {tLoginPage("PrivacyPolicy")}
          </Text>
        </Text>

        {error ? (
          <Text style={[styles.errorText, { color: colors.dangerText }]}>{error}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
    maxWidth: 440,
    padding: 20,
    width: "100%",
  },
  description: {
    fontSize: MOBILE_TYPOGRAPHY.fontSize.bodyLarge,
    textAlign: "center",
  },
  errorText: {
    fontSize: 12,
    marginTop: 6,
    textAlign: "center",
  },
  link: {
    textDecorationLine: "underline",
  },
  logo: {
    fontSize: 30,
    fontWeight: MOBILE_TYPOGRAPHY.fontWeight.bold,
    textAlign: "center",
  },
  providerButton: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  providerButtonDisabled: {
    opacity: 0.72,
  },
  providerContent: {
    alignItems: "center",
    flexDirection: "row",
  },
  providerIconSection: {
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    width: 20,
  },
  providers: {
    gap: 10,
  },
  providerText: {
    flex: 1,
    fontSize: MOBILE_TYPOGRAPHY.fontSize.bodyLarge,
    fontWeight: MOBILE_TYPOGRAPHY.fontWeight.semibold,
  },
  screen: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: 16,
  },
  termsText: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
  unavailableText: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
});
