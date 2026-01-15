"use client";

import { Anchor, Container, Stack, Text, Title, Box, Paper, Group, ThemeIcon } from "@mantine/core";
import { IconMail, IconBrandLinkedin, IconBrandGithub } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { Team } from "@/components/landing";
import { SOCIAL_LINKS } from "@/lib/config";

const CONTACT_METHODS = [
  {
    text: SOCIAL_LINKS.email,
    href: `mailto:${SOCIAL_LINKS.email}`,
    icon: IconMail,
    color: "violet",
    target: undefined,
  },
  {
    text: "Follow us on LinkedIn",
    href: SOCIAL_LINKS.linkedin,
    icon: IconBrandLinkedin,
    color: "blue",
    target: "_blank" as const,
  },
  {
    text: "Star us on GitHub",
    href: SOCIAL_LINKS.github,
    icon: IconBrandGithub,
    color: "dark",
    target: "_blank" as const,
  },
] as const;

export default function ContactPage() {
  const t = useTranslations("ContactPage");

  return (
    <Box>
      <Container size="md" py={120}>
        <Stack align="center" gap="xl">
          <Stack align="center" gap="md">
            <Title order={1} ta="center" size="h1">
              {t("Title")}
            </Title>
            <Text ta="center" size="lg" c="dimmed" maw={600}>
              {t("Description")}
            </Text>
          </Stack>

          <Paper
            shadow="sm"
            radius="lg"
            p="xl"
            withBorder
            w="100%"
            maw={500}
            className="card-scale-effect"
          >
            <Stack gap="lg">
              {CONTACT_METHODS.map((method) => (
                <Group key={method.text} gap="md">
                  <ThemeIcon size={48} radius="md" variant="light" color={method.color}>
                    <method.icon size={24} />
                  </ThemeIcon>
                  <Anchor
                    href={method.href}
                    target={method.target}
                    size="lg"
                    fw={600}
                    c={"var(--mantine-color-text)"}
                  >
                    {method.text}
                  </Anchor>
                </Group>
              ))}
            </Stack>
          </Paper>
        </Stack>
      </Container>

      <Team />
    </Box>
  );
}
