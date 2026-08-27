"use client";

import { Stack } from "@mantine/core";
import { IconBrandInstagram } from "@tabler/icons-react";
import { IntegrationCard } from "@/components/shared/IntegrationCard";
import { useSettingsPageTranslations } from "@/lib/i18n/generated/hooks";
import { openInstagramImportModal } from "../modals/openInstagramImportModal";

export function InstagramImportSection() {
  const t = useSettingsPageTranslations("DataManagement.InstagramImport");

  return (
    <Stack gap="sm">
      <IntegrationCard
        displayName={t("Instagram")}
        icon={IconBrandInstagram}
        iconColor="pink"
        isConnected={false}
        isDisabled={false}
        isLinkable={false}
        onClick={() => openInstagramImportModal()}
        provider="instagram_import"
      />
    </Stack>
  );
}
