"use client";

import { IconDatabaseImport } from "@tabler/icons-react";
import { IntegrationCard } from "@/components/shared/IntegrationCard";
import { useSettingsPageTranslations } from "@/lib/i18n/generated/hooks";
import { openBonderyImportModal } from "../modals/openBonderyImportModal";

export function BonderyImportSection() {
  const t = useSettingsPageTranslations("DataManagement.BonderyImport");

  return (
    <IntegrationCard
      displayName={t("CardTitle")}
      icon={IconDatabaseImport}
      iconColor="violet"
      isConnected={false}
      isDisabled={false}
      isLinkable={false}
      onClick={() => openBonderyImportModal({ entryPoint: "settings" })}
      provider="bondery_json_import"
    />
  );
}
