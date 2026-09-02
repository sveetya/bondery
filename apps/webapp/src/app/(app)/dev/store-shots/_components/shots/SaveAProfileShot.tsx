"use client";

import { LogoIcon } from "@bondery/mantine-next";
import { Group, Paper, Stack, ThemeIcon } from "@mantine/core";
import { IconArrowDown, IconBrandInstagram, IconBrandLinkedin } from "@tabler/icons-react";
import { STORE_SHOT_COPY } from "../../_lib/copy";
import { StoreShotFrame } from "../StoreShotFrame";

const LINKEDIN_BLUE = "#0A66C2";

export function SaveAProfileShot() {
  const copy = STORE_SHOT_COPY["save-a-profile"];

  return (
    <StoreShotFrame headline={copy.headline}>
      <Stack align="center" gap="lg" w={540}>
        <Group gap="xl">
          <ThemeIcon
            color={LINKEDIN_BLUE}
            radius={40}
            size={160}
            style={{ boxShadow: "var(--mantine-shadow-xl)" }}
          >
            <IconBrandLinkedin color="white" size={84} stroke={1.4} />
          </ThemeIcon>
          <ThemeIcon
            color="pink"
            radius={40}
            size={160}
            style={{ boxShadow: "var(--mantine-shadow-xl)" }}
          >
            <IconBrandInstagram color="white" size={84} stroke={1.4} />
          </ThemeIcon>
        </Group>
        <IconArrowDown color="white" size={58} stroke={1.5} />
        <Paper
          bg="white"
          h={124}
          radius={34}
          shadow="xl"
          style={{ alignItems: "center", display: "flex", justifyContent: "center" }}
          w={124}
        >
          <LogoIcon size={74} />
        </Paper>
      </Stack>
    </StoreShotFrame>
  );
}
