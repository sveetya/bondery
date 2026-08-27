"use client";

import { modals } from "@mantine/modals";
import { captureEvent } from "@/lib/analytics/client";
import { createModalId } from "@/lib/modals";
import { BonderyImportModal } from "./BonderyImportModal";
import { BonderyImportModalTitle } from "./BonderyImportModalTitle";

export type BonderyImportEntryPoint = "command_palette" | "settings";

export function openBonderyImportModal({
  entryPoint = "settings",
}: {
  entryPoint?: BonderyImportEntryPoint;
} = {}) {
  const modalId = createModalId("bondery-import");

  captureEvent("account_settings:import_view", { entry_point: entryPoint });

  modals.open({
    children: <BonderyImportModal modalId={modalId} />,
    modalId,
    size: "lg",
    title: <BonderyImportModalTitle />,
  });
}
