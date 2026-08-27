"use client";

import { IconDatabaseExport } from "@tabler/icons-react";
import { IntegrationCard } from "@/components/shared/IntegrationCard";
import { useSettingsPageTranslations } from "@/lib/i18n/generated/hooks";
import { openBonderyExportModal } from "../modals/openBonderyExportModal";

export function BonderyExportSection() {
  const t = useSettingsPageTranslations("DataManagement.Export");

  return (
    <IntegrationCard
      displayName={t("Title")}
      icon={IconDatabaseExport}
      iconColor="violet"
      isConnected={false}
      isDisabled={false}
      isLinkable={false}
      onClick={() => openBonderyExportModal({ entryPoint: "settings" })}
      provider="bondery_export"
    />
  );
}
