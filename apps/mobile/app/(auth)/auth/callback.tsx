import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { authClient } from "../../../src/lib/auth/client";
import { useMobileAuthTranslations } from "../../../src/lib/i18n/generated/hooks";
import { MOBILE_TYPOGRAPHY } from "../../../src/theme/tokens";
import { useMobileThemeColors } from "../../../src/theme/useMobileThemeColors";

export default function AuthCallbackScreen() {
  const tMobileAuth = useMobileAuthTranslations();
  const router = useRouter();
  const colors = useMobileThemeColors();
  const [statusError, setStatusError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const completeSignIn = async () => {
      if (!authClient) {
        if (active) {
          setStatusError(tMobileAuth("MissingConfig"));
        }
        return;
      }

      const { data, error } = await authClient.getSession();

      if (error) {
        if (active) {
          setStatusError(error.message ?? tMobileAuth("MissingCode"));
        }
        return;
      }

      if (data?.session) {
        router.replace("/contacts");
        return;
      }

      if (active) {
        setStatusError(tMobileAuth("MissingCode"));
      }
    };

    void completeSignIn();

    return () => {
      active = false;
    };
  }, [router, tMobileAuth]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.surface }]}>
      <ActivityIndicator color={colors.textPrimary} size="large" />
      <Text style={[styles.title, { color: colors.textSecondary }]}>
        {tMobileAuth("CompletingLogin")}
      </Text>
      {statusError ? (
        <Text style={[styles.error, { color: colors.dangerText }]}>{statusError}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  error: {
    textAlign: "center",
  },
  screen: {
    alignItems: "center",
    flex: 1,
    gap: 12,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  title: {
    fontSize: MOBILE_TYPOGRAPHY.fontSize.bodyLarge,
    fontWeight: MOBILE_TYPOGRAPHY.fontWeight.semibold,
  },
});
