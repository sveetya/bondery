"use client";

import { ModalTitle } from "@bondery/mantine-next";
import { IconDatabaseImport } from "@tabler/icons-react";
import { useSettingsPageTranslations } from "@/lib/i18n/generated/hooks";

export function BonderyImportModalTitle() {
  const t = useSettingsPageTranslations("DataManagement.BonderyImport");
  return <ModalTitle icon={<IconDatabaseImport size={20} stroke={1.5} />} text={t("ModalTitle")} />;
}
