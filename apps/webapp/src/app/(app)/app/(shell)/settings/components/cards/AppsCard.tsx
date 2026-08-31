"use client";

import { CardSection } from "@mantine/core";
import { IconApps } from "@tabler/icons-react";
import { useSettingsPageTranslations } from "@/lib/i18n/generated/hooks";
import { useSettingsQuery } from "@/lib/query/hooks/useSettings";
import { ProviderIntegrations } from "./ProviderIntegrations";
import { SettingsSection } from "./SettingsSection";

export function AppsCard() {
  const t = useSettingsPageTranslations("Apps");
  const { data: settingsResult } = useSettingsQuery();

  const settings = settingsResult?.data;
  if (!settings) {
    return null;
  }

  const providers = Array.isArray(settings.providers) ? (settings.providers as string[]) : [];
  const userIdentities = Array.isArray(settings.identities)
    ? (settings.identities as Array<{
        id: string;
        identity_id: string;
        provider: string;
        user_id: string;
      }>)
    : [];

  return (
    <SettingsSection icon={<IconApps size={20} stroke={1.5} />} id="apps" title={t("Title")}>
      <CardSection inheritPadding py="md">
        <ProviderIntegrations
          description={t("Description")}
          hideTitle
          providers={providers}
          showOAuthProviders={false}
          userIdentities={userIdentities}
        />
      </CardSection>
    </SettingsSection>
  );
}
