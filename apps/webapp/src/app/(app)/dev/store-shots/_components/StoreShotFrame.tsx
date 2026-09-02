"use client";

import { OG_GRADIENT_FROM, OG_GRADIENT_TO } from "@bondery/branding/og/constants";
import { BonderyLogotypeWhite } from "@bondery/branding/react";
import { bonderyTheme } from "@bondery/mantine-next";
import {
  Box,
  Flex,
  MantineProvider,
  Stack,
  Text,
  Title,
  v8CssVariablesResolver,
} from "@mantine/core";
import type { CSSProperties, ReactNode } from "react";

const STORE_SHOT_WIDTH = 1280;
const STORE_SHOT_HEIGHT = 800;
const COPY_COLUMN_WIDTH = 500;

const STORE_SHOT_BACKGROUND = `linear-gradient(135deg, ${OG_GRADIENT_FROM} 0%, ${OG_GRADIENT_TO} 100%)`;

interface StoreShotFrameProps {
  children: ReactNode;
  headline: string;
  subcopy?: string;
}

/**
 * Fixed CWS canvas (1280×800, opaque brand gradient). Nested light scheme so
 * product chrome inside the visual column always renders as light mode.
 */
export function StoreShotFrame({ headline, subcopy, children }: StoreShotFrameProps) {
  return (
    <MantineProvider
      cssVariablesResolver={v8CssVariablesResolver}
      forceColorScheme="light"
      theme={bonderyTheme}
    >
      <Box
        data-store-shot=""
        style={
          {
            "--mantine-color-default-border": "transparent",
            "--mantine-color-gray-3": "transparent",
            backgroundColor: OG_GRADIENT_FROM,
            backgroundImage: STORE_SHOT_BACKGROUND,
            height: STORE_SHOT_HEIGHT,
            overflow: "hidden",
            position: "relative",
            width: STORE_SHOT_WIDTH,
          } as CSSProperties
        }
      >
        <Box left={64} pos="absolute" style={{ zIndex: 2 }} top={52}>
          <BonderyLogotypeWhite aria-hidden height={40} width={136} />
        </Box>
        <Flex align="center" gap={48} h="100%" pt={92} px={64} wrap="nowrap">
          <Stack gap={22} pr={8} style={{ flexShrink: 0, width: COPY_COLUMN_WIDTH }}>
            <Title c="white" fw={700} fz={52} lh={1.08} order={1}>
              {headline}
            </Title>
            {subcopy ? (
              <Text c="white" fz={21} lh={1.5} maw={430}>
                {subcopy}
              </Text>
            ) : null}
          </Stack>
          <Flex
            align="center"
            h="100%"
            justify="center"
            style={{ flex: 1, minWidth: 0, pointerEvents: "none" }}
          >
            {children}
          </Flex>
        </Flex>
      </Box>
    </MantineProvider>
  );
}
