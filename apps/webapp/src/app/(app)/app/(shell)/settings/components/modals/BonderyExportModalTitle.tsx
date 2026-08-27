"use client";

import { ModalTitle } from "@bondery/mantine-next";
import { IconFileZip } from "@tabler/icons-react";
import { useSettingsPageTranslations } from "@/lib/i18n/generated/hooks";

export function BonderyExportModalTitle() {
  const t = useSettingsPageTranslations("DataManagement.Export");
  return <ModalTitle icon={<IconFileZip size={20} stroke={1.5} />} text={t("ModalTitle")} />;
}
