"use client";

import { modals } from "@mantine/modals";
import { createModalId } from "@/lib/modals";
import { PwaInstallModal } from "./PwaInstallModal";
import { PwaInstallModalTitle } from "./PwaInstallModalTitle";

interface OpenPwaInstallModalOptions {
  canInstall: boolean;
  install: () => Promise<void>;
  isChromiumDesktop: boolean;
}

export function openPwaInstallModal({
  canInstall,
  isChromiumDesktop,
  install,
}: OpenPwaInstallModalOptions) {
  const modalId = createModalId("pwa-install");

  modals.open({
    children: (
      <PwaInstallModal
        canInstall={canInstall}
        install={install}
        isChromiumDesktop={isChromiumDesktop}
        modalId={modalId}
      />
    ),
    modalId,
    size: "md",
    title: <PwaInstallModalTitle />,
  });
}
