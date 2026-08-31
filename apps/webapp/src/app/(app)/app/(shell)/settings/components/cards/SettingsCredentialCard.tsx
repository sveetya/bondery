"use client";

import { ActionIcon, Box, Card, Group, Text, ThemeIcon } from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
import type { ReactNode } from "react";

const LAST_USED_COLUMN_WIDTH = 180;

type SettingsCredentialCardProps = {
  children?: ReactNode;
  deleteAriaLabel: string;
  icon: ReactNode;
  label: ReactNode;
  lastUsedLabel: string;
  onDelete: () => void;
};

export function SettingsCredentialCard({
  children,
  deleteAriaLabel,
  icon,
  label,
  lastUsedLabel,
  onDelete,
}: SettingsCredentialCardProps) {
  return (
    <Card padding="sm" radius="md" withBorder>
      <Group align="center" gap="sm" wrap="nowrap">
        <ThemeIcon color="gray" radius="md" size="lg" variant="light">
          {icon}
        </ThemeIcon>

        <Box style={{ flex: 1, minWidth: 120 }}>{label}</Box>

        {children}

        <Text c="dimmed" size="xs" style={{ flexShrink: 0 }} truncate w={LAST_USED_COLUMN_WIDTH}>
          {lastUsedLabel}
        </Text>

        <ActionIcon
          aria-label={deleteAriaLabel}
          color="red"
          onClick={onDelete}
          size="sm"
          style={{ flexShrink: 0 }}
          variant="subtle"
        >
          <IconTrash size={16} />
        </ActionIcon>
      </Group>
    </Card>
  );
}
