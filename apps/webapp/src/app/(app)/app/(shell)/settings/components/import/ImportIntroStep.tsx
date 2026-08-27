"use client";

import { ModalFooter } from "@bondery/mantine-next";
import { Group, Paper, Stack, Text, ThemeIcon, Title } from "@mantine/core";
import { IconArrowRight, IconCircleCheck, type Icon as TablerIconType } from "@tabler/icons-react";

interface ImportIntroStepProps {
  cancelLabel: string;
  continueLabel: string;
  descriptions: [string, string, string];
  icon: TablerIconType;
  iconColor: string;
  introTitle: string;
  onCancel: () => void;
  onContinue: () => void;
}

export function ImportIntroStep({
  cancelLabel,
  continueLabel,
  descriptions,
  icon: Icon,
  iconColor,
  introTitle,
  onCancel,
  onContinue,
}: ImportIntroStepProps) {
  return (
    <Stack gap="xl">
      <Stack align="center" gap="md" pt="sm">
        <ThemeIcon color={iconColor} radius="xl" size={110} variant="light">
          <Icon size={64} />
        </ThemeIcon>
        <Title order={4} ta="center">
          {introTitle}
        </Title>
      </Stack>

      <Paper p="md" radius="md" withBorder>
        <Stack gap="sm">
          {descriptions.map((description) => (
            <Group align="flex-start" gap="sm" key={description} wrap="nowrap">
              <IconCircleCheck
                size={18}
                style={{
                  color: `var(--mantine-color-${iconColor}-6)`,
                  flexShrink: 0,
                  marginTop: 1,
                }}
              />
              <Text size="sm">{description}</Text>
            </Group>
          ))}
        </Stack>
      </Paper>

      <ModalFooter
        actionLabel={continueLabel}
        actionRightSection={<IconArrowRight size={16} />}
        cancelLabel={cancelLabel}
        onAction={onContinue}
        onCancel={onCancel}
      />
    </Stack>
  );
}
