"use client";

import { Button, Stack, Text, Title } from "@mantine/core";
import { useCommonTranslations } from "@/lib/i18n/generated/hooks";

interface QueryLoadErrorProps {
  onRetry: () => void;
}

export function QueryLoadError({ onRetry }: QueryLoadErrorProps) {
  const t = useCommonTranslations();

  return (
    <Stack align="center" gap="md" justify="center" mih="50vh" p="xl">
      <Title order={2}>{t("errors.requestFailed")}</Title>
      <Text c="dimmed" ta="center">
        {t("errors.apiUnreachable")}
      </Text>
      <Button onClick={onRetry}>{t("actions.retry")}</Button>
    </Stack>
  );
}
