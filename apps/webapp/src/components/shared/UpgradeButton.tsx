"use client";

import type { BillingInterval } from "@bondery/schemas";
import type { ButtonProps } from "@mantine/core";
import { Button, Modal, SegmentedControl, Stack, Tooltip } from "@mantine/core";
import { IconSparkles } from "@tabler/icons-react";
import { useId, useState } from "react";
import { useEmbeddedCheckout } from "@/hooks/useEmbeddedCheckout";
import { useCheckoutTranslations } from "@/lib/i18n/generated/hooks";
import { useSubscriptionQuery } from "@/lib/query/hooks/useSubscription";

type UpgradeButtonProps = Omit<ButtonProps, "onClick" | "loading"> & {
  onSuccess?: () => void;
};

export function UpgradeButton({ onSuccess, ...rest }: UpgradeButtonProps) {
  const t = useCheckoutTranslations();
  const checkoutMountId = `stripe-embedded-checkout-${useId().replace(/:/g, "")}`;
  const [interval, setInterval] = useState<BillingInterval>("month");
  const { data: subscriptionStatus } = useSubscriptionQuery();
  const { closeCheckout, openCheckout, isLoading, isModalOpen } = useEmbeddedCheckout({
    checkoutMountId,
    onSuccess,
  });

  const upgradesEnabled = subscriptionStatus?.upgradesEnabled ?? false;

  const button = (
    <Button
      disabled={!upgradesEnabled}
      leftSection={<IconSparkles size={16} />}
      loading={isLoading}
      onClick={() => void openCheckout(interval)}
      {...rest}
    >
      {t("upgradeToPremium")}
    </Button>
  );

  return (
    <Stack gap="xs">
      <SegmentedControl
        data={[
          { label: t("intervalMonthly"), value: "month" },
          { label: t("intervalAnnual"), value: "year" },
        ]}
        disabled={!upgradesEnabled || isLoading}
        onChange={(value) => setInterval(value as BillingInterval)}
        value={interval}
      />
      {upgradesEnabled ? (
        button
      ) : (
        <Tooltip label={t("upgradesDisabledTooltip")}>{button}</Tooltip>
      )}
      <Modal centered onClose={closeCheckout} opened={isModalOpen} size="lg" title="Checkout">
        <div id={checkoutMountId} />
      </Modal>
    </Stack>
  );
}
