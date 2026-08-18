"use client";

import { bonderyTheme } from "@bondery/mantine-next";
import { MantineProvider, v8CssVariablesResolver } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import type { ReactNode } from "react";

export function MantineShell({ children }: { children: ReactNode }) {
  return (
    <MantineProvider
      cssVariablesResolver={v8CssVariablesResolver}
      defaultColorScheme="dark"
      theme={bonderyTheme}
    >
      <Notifications autoClose={6000} position="top-center" />
      {children}
    </MantineProvider>
  );
}
