"use client";

import { Stack, Switch, Text } from "@mantine/core";
import { applyPostHogConsentState } from "@/lib/analytics/client";
import { useSettingsPageTranslations } from "@/lib/i18n/generated/hooks";
import { useSettingsQuery, useUpdateSettingsMutation } from "@/lib/query/hooks/useSettings";

export function ProductAnalyticsSection() {
  const t = useSettingsPageTranslations("DataManagement.ProductAnalytics");
  const { data: settingsResult } = useSettingsQuery();
  const updateSettings = useUpdateSettingsMutation();

  const enabled = settingsResult?.data?.productAnalyticsEnabled !== false;

  const handleToggle = (checked: boolean) => {
    applyPostHogConsentState(checked);
    updateSettings.mutate({ productAnalyticsEnabled: checked });
  };

  return (
    <Stack gap="xs">
      <Text fw={500} size="sm">
        {t("Title")}
      </Text>
      <Text c="dimmed" size="xs">
        {t("Description")}
      </Text>
      <Switch
        checked={enabled}
        disabled={updateSettings.isPending}
        label={t("SwitchLabel")}
        onChange={(event) => handleToggle(event.currentTarget.checked)}
      />
    </Stack>
  );
}
