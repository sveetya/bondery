"use client";

import { useState } from "react";
import {
  Container,
  Paper,
  Title,
  Text,
  Button,
  Stack,
  Center,
  Box,
  Anchor,
} from "@mantine/core";
import { IconBrandGithubFilled, IconX } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { createBrowswerSupabaseClient } from "@/lib/supabase/client";
import { useTranslations } from "next-intl";
import Link from "next/link";

export default function LoginPage() {
  const t = useTranslations("LoginPage");
  const [loading, setLoading] = useState(false);
  const supabase = createBrowswerSupabaseClient();

  const handleGithubLogin = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        notifications.show({
          title: t("AuthenticationError"),
          message: error.message,
          color: "red",
          icon: <IconX size={18} />,
        });
      }
    } catch (err) {
      notifications.show({
        title: t("UnexpectedError"),
        message:
          err instanceof Error ? err.message : t("UnexpectedErrorMessage"),
        color: "red",
        icon: <IconX size={18} />,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size={420}>
      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <Stack gap="md">
          <Title order={2} ta="center">
            {t("Title")}
          </Title>
          <Text c="dimmed" size="sm" ta="center">
            {t("Description")}
          </Text>

          <Button
            fullWidth
            leftSection={<IconBrandGithubFilled size={20} />}
            onClick={handleGithubLogin}
            loading={loading}
            disabled={loading}
            color="black"
          >
            {t("ContinueWithGithub")}
          </Button>

          <Text c="dimmed" size="xs" ta="center">
            {t.rich("TermsText", {
              termsLink: (chunks) => (
                <Anchor component={Link} href="/terms">
                  {chunks}
                </Anchor>
              ),
              privacyLink: (chunks) => (
                <Anchor component={Link} href="/privacy">
                  {chunks}
                </Anchor>
              ),
            })}
          </Text>
        </Stack>
      </Paper>
    </Container>
  );
}
