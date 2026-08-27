"use client";

import { ModalTitle } from "@bondery/mantine-next";
import { IconDeviceDesktop } from "@tabler/icons-react";
import { useSettingsPageTranslations } from "@/lib/i18n/generated/hooks";

export function PwaInstallModalTitle() {
  const t = useSettingsPageTranslations("Integration");
  return <ModalTitle icon={<IconDeviceDesktop size={20} stroke={1.5} />} text={t("DesktopApp")} />;
}
