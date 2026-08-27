"use client";

import { Group, Switch, Text } from "@mantine/core";
import { applyPostHogConsentState } from "@/lib/analytics/client";
import { useSettingsPageTranslations } from "@/lib/i18n/generated/hooks";
import { useSettingsQuery, useUpdateSettingsMutation } from "@/lib/query/hooks/useSettings";

export function ProductAnalyticsSection() {
  const t = useSettingsPageTranslations("DataManagement.ProductAnalytics");
  const { data: settingsResult } = useSettingsQuery();
  const updateSettings = useUpdateSettingsMutation();
  const settings = settingsResult?.data;
  if (!settings) {
    return null;
  }

  const enabled = settings.productAnalyticsEnabled !== false;

  const handleToggle = (checked: boolean) => {
    applyPostHogConsentState(checked);
    updateSettings.mutate({ productAnalyticsEnabled: checked });
  };

  return (
    <Group align="flex-start" justify="space-between" wrap="nowrap">
      <div style={{ flex: 1 }}>
        <Text fw={500} mb={4} size="sm">
          {t("Title")}
        </Text>
        <Text c="dimmed" size="xs">
          {t("Description")}
        </Text>
      </div>
      <Switch
        aria-label={t("SwitchLabel")}
        checked={enabled}
        disabled={updateSettings.isPending}
        onChange={(event) => handleToggle(event.currentTarget.checked)}
        styles={{
          body: { alignItems: "center" },
          labelWrapper: { display: "none" },
          root: { alignItems: "center", display: "flex", height: 36 },
        }}
      />
    </Group>
  );
}
