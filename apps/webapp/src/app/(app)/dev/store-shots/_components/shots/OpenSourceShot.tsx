"use client";

import { PersonCard } from "@bondery/mantine-next";
import { Box, Flex, Group, Image, Paper, Stack, Text, ThemeIcon } from "@mantine/core";
import type { ReactNode } from "react";
import { STORE_SHOT_COPY } from "../../_lib/copy";
import {
  ADA_LOVELACE,
  ALAN_TURING,
  GRACE_HOPPER,
  HEDY_LAMARR,
  KATHERINE_JOHNSON,
  MARGARET_HAMILTON,
} from "../../_lib/fixtures";
import { StoreShotFrame } from "../StoreShotFrame";

const PEOPLE_COLUMNS = [
  [ADA_LOVELACE, GRACE_HOPPER, KATHERINE_JOHNSON],
  [ALAN_TURING, MARGARET_HAMILTON, HEDY_LAMARR],
] as const;

const BENEFIT_CARD_BG = "rgba(255, 255, 255, 0.65)";
const BENEFIT_ICON_BG = "rgba(255, 255, 255, 0.92)";

function TrustPoint({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <Paper bg={BENEFIT_CARD_BG} p="md" radius="xl" shadow="md" w={168}>
      <Stack align="center" gap="sm">
        <ThemeIcon
          bg={BENEFIT_ICON_BG}
          color="dark"
          radius="50%"
          size={48}
          style={{ borderRadius: "50%" }}
        >
          {icon}
        </ThemeIcon>
        <Text c="dark.8" fw={650} fz={14} ta="center">
          {label}
        </Text>
      </Stack>
    </Paper>
  );
}

export function OpenSourceShot() {
  const copy = STORE_SHOT_COPY["open-source"];

  return (
    <StoreShotFrame headline={copy.headline}>
      <Box h={520} w={620}>
        <Flex align="center" h="100%" justify="center">
          <Group align="center" gap="sm" wrap="nowrap">
            {PEOPLE_COLUMNS.map((people, columnIndex) => (
              <Stack
                gap="sm"
                key={people[0].id}
                style={{ flex: 1, transform: `translateY(${columnIndex === 0 ? -24 : 24}px)` }}
              >
                {people.map((person) => (
                  <PersonCard key={person.id} person={person} size="md" />
                ))}
              </Stack>
            ))}
          </Group>
        </Flex>
      </Box>
      <Box
        bottom={32}
        left="50%"
        pos="absolute"
        style={{ transform: "translateX(-50%)", zIndex: 4 }}
      >
        <Group gap="md" wrap="nowrap">
          <TrustPoint
            icon={<Image alt="" h={24} src="/icons/brands/github.svg" w={24} />}
            label="Verify on GitHub"
          />
          <TrustPoint
            icon={<Image alt="" h={24} src="/icons/brands/eu.svg" w={30} />}
            label="Hosted in EU"
          />
          <TrustPoint
            icon={<Image alt="" h={26} src="/icons/brands/docker.svg" w={30} />}
            label="Self-hostable"
          />
        </Group>
      </Box>
    </StoreShotFrame>
  );
}
