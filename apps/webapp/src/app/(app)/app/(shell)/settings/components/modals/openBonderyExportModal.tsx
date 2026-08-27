"use client";

import { modals } from "@mantine/modals";
import { captureEvent } from "@/lib/analytics/client";
import { createModalId } from "@/lib/modals";
import { BonderyExportModal } from "./BonderyExportModal";
import { BonderyExportModalTitle } from "./BonderyExportModalTitle";

export type BonderyExportEntryPoint = "command_palette" | "settings";

export function openBonderyExportModal({
  entryPoint = "settings",
}: {
  entryPoint?: BonderyExportEntryPoint;
} = {}) {
  const modalId = createModalId("bondery-export");

  captureEvent("account_settings:export_view", { entry_point: entryPoint });

  modals.open({
    children: <BonderyExportModal modalId={modalId} />,
    modalId,
    size: "md",
    title: <BonderyExportModalTitle />,
  });
}
