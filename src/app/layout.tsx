import type { Metadata } from "next";
import "./globals.css";
import { Notifications } from "@mantine/notifications";
import { NextIntlClientProvider } from "next-intl";

import {
  ColorSchemeScript,
  MantineProvider,
  mantineHtmlProps,
  createTheme,
  Input,
  Menu,
} from "@mantine/core";

const theme = createTheme({
  cursorType: "pointer",

  primaryColor: "branding-primary",
  colors: {
    "branding-primary": [
      "#faedff",
      "#edd9f7",
      "#d8b1ea",
      "#c186dd",
      "#ae62d2",
      "#a34bcb",
      "#9d3fc9",
      "#8931b2",
      "#7a2aa0",
      "#6b218d",
    ],
  },
  components: {
    Menu: {
      defaultProps: {
        shadow: "md",
      },
    },
    Button: {
      defaultProps: {
        className: "button-scale-effect",
      },
    },
    Input: {
      defaultProps: {
        className: "input-scale-effect",
      },
    },
    NavLink: {
      defaultProps: {
        className: "button-scale-effect",
      },
    },
  },
});
import "dayjs/locale/en";
import { DatesProvider } from "@mantine/dates";

export const metadata: Metadata = {
  title: "Bondee",
  description: "Build bonds that last forever.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = "en-UK";
  return (
    <html lang="en" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript
          nonce="8IBTHwOdqNKAWeKl7plt8g=="
          defaultColorScheme="auto"
        />
      </head>
      <body>
        <MantineProvider defaultColorScheme="auto" theme={theme}>
          <NextIntlClientProvider locale={locale}>
            <DatesProvider settings={{}}>
              <Notifications autoClose={5000} position="top-center" />
              {children}
            </DatesProvider>
          </NextIntlClientProvider>
        </MantineProvider>
      </body>
    </html>
  );
}
