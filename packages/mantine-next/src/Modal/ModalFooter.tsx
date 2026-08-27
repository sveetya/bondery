"use client";

import type { MantineSpacing } from "@mantine/core";
import { Button, Group, Stack, Switch, VisuallyHidden } from "@mantine/core";
import { IconCheck, IconTrash } from "@tabler/icons-react";
import { type ReactNode, useId } from "react";

export interface ModalFooterProps {
  actionColor?: string;
  actionDisabled?: boolean;
  actionLabel?: string;
  actionLeftSection?: ReactNode;
  actionLoading?: boolean;
  actionRightSection?: ReactNode;
  actionType?: "button" | "submit";
  actionVariant?: "filled" | "light" | "outline" | "subtle" | "default";
  backDisabled?: boolean;
  backLabel?: string;
  backLeftSection?: ReactNode;
  cancelDisabled?: boolean;
  cancelLabel?: string;
  createMoreAriaDescription?: string;
  createMoreChecked?: boolean;
  createMoreDisabled?: boolean;
  createMoreLabel?: string;
  dangerDisabled?: boolean;
  dangerLabel?: string;
  dangerLeftSection?: ReactNode;
  mt?: MantineSpacing;
  onAction?: () => void;
  onBack?: () => void;
  onCancel?: () => void;
  onCreateMoreChange?: (checked: boolean) => void;
  onDanger?: () => void;
}

export function ModalFooter({
  mt = "md",
  dangerLabel,
  onDanger,
  dangerDisabled,
  dangerLeftSection,
  backLabel,
  onBack,
  backDisabled,
  backLeftSection,
  cancelLabel,
  onCancel,
  cancelDisabled,
  createMoreAriaDescription,
  createMoreChecked = false,
  createMoreDisabled,
  createMoreLabel,
  onCreateMoreChange,
  actionLabel,
  onAction,
  actionType = "button",
  actionColor,
  actionVariant = "filled",
  actionLeftSection,
  actionRightSection,
  actionLoading = false,
  actionDisabled,
}: ModalFooterProps) {
  const createMoreDescriptionId = useId();
  const showDanger = Boolean(dangerLabel && onDanger);
  const showBack = Boolean(backLabel && onBack);
  const showCancel = Boolean(cancelLabel && onCancel);
  const showAction = Boolean(actionLabel);
  const showRightCluster = showCancel || showAction;
  const singleAction = showAction && !showCancel && !showBack && !showDanger;
  const showCreateMore = !showDanger && !showBack && Boolean(createMoreLabel && onCreateMoreChange);
  const resolvedActionLeftSection = singleAction
    ? actionLeftSection
    : actionLeftSection ||
      (!actionRightSection && showAction ? <IconCheck size={16} /> : undefined);
  const resolvedDangerLeftSection = dangerLeftSection ?? <IconTrash size={16} />;

  if (singleAction) {
    return (
      <Stack mt={mt}>
        <Button
          color={actionColor}
          disabled={actionDisabled}
          fullWidth
          leftSection={resolvedActionLeftSection}
          loading={actionLoading}
          onClick={onAction}
          rightSection={actionRightSection}
          type={actionType}
          variant={actionVariant}
        >
          {actionLabel}
        </Button>
      </Stack>
    );
  }

  const leftSlot =
    showDanger || showBack ? (
      <Group gap="sm">
        {showDanger ? (
          <Button
            color="red"
            disabled={dangerDisabled}
            leftSection={resolvedDangerLeftSection}
            onClick={onDanger}
            type="button"
            variant="light"
          >
            {dangerLabel}
          </Button>
        ) : null}
        {showBack ? (
          <Button
            disabled={backDisabled}
            leftSection={backLeftSection}
            onClick={onBack}
            variant="default"
          >
            {backLabel}
          </Button>
        ) : null}
      </Group>
    ) : showCreateMore && onCreateMoreChange ? (
      <Group gap="sm" style={{ flexShrink: 0 }} wrap="nowrap">
        <Switch
          aria-describedby={createMoreAriaDescription ? createMoreDescriptionId : undefined}
          checked={createMoreChecked}
          disabled={createMoreDisabled}
          label={createMoreLabel}
          onChange={(event) => onCreateMoreChange(event.currentTarget.checked)}
          size="sm"
          styles={{ label: { whiteSpace: "nowrap" } }}
        />
        {createMoreAriaDescription ? (
          <VisuallyHidden id={createMoreDescriptionId}>{createMoreAriaDescription}</VisuallyHidden>
        ) : null}
      </Group>
    ) : null;

  return (
    <Group
      align="center"
      gap="sm"
      justify={showDanger || showBack || showCreateMore ? "space-between" : "flex-end"}
      mt={mt}
      wrap="nowrap"
    >
      {leftSlot}

      {showRightCluster ? (
        <Group gap="sm" justify="flex-end" ml={showCreateMore ? "auto" : undefined} wrap="nowrap">
          {showCancel ? (
            <Button disabled={cancelDisabled} onClick={onCancel} variant="default">
              {cancelLabel}
            </Button>
          ) : null}

          {showAction ? (
            <Button
              color={actionColor}
              disabled={actionDisabled}
              leftSection={resolvedActionLeftSection}
              loading={actionLoading}
              onClick={onAction}
              rightSection={actionRightSection}
              type={actionType}
              variant={actionVariant}
            >
              {actionLabel}
            </Button>
          ) : null}
        </Group>
      ) : null}
    </Group>
  );
}
