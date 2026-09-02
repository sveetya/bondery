"use client";

import { SimpleGrid, Stack, Text, ThemeIcon } from "@mantine/core";
import type { Icon as TablerIcon } from "@tabler/icons-react";
import { IconApi, IconDeviceMobile, IconPlugConnected, IconWorldWww } from "@tabler/icons-react";
import { STORE_SHOT_COPY } from "../../_lib/copy";
import { StoreShotFrame } from "../StoreShotFrame";

const SURFACES = [
  { icon: IconWorldWww, label: "Web app" },
  { icon: IconDeviceMobile, label: "Mobile apps" },
  { icon: IconApi, label: "API" },
  { icon: IconPlugConnected, label: "MCP" },
] as const;

const ICON_SIZE = 96;
const GLYPH_SIZE = 46;

function AccessMethod({ icon: Icon, label }: { icon: TablerIcon; label: string }) {
  return (
    <Stack align="center" gap="md" w={148}>
      <ThemeIcon
        bg="rgba(255, 255, 255, 0.22)"
        color="white"
        radius="50%"
        size={ICON_SIZE}
        style={{ borderRadius: "50%" }}
      >
        <Icon color="white" size={GLYPH_SIZE} stroke={1.5} />
      </ThemeIcon>
      <Text c="white" fw={650} fz={19} ta="center">
        {label}
      </Text>
    </Stack>
  );
}

export function EverySurfaceShot() {
  const copy = STORE_SHOT_COPY["every-surface"];

  return (
    <StoreShotFrame headline={copy.headline}>
      <SimpleGrid cols={2} spacing={40} w={360}>
        {SURFACES.map((surface) => (
          <AccessMethod icon={surface.icon} key={surface.label} label={surface.label} />
        ))}
      </SimpleGrid>
    </StoreShotFrame>
  );
}
