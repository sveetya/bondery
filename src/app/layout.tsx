import type { Metadata } from "next";
import "./globals.css";
import { Notifications } from "@mantine/notifications";
import { NextIntlClientProvider } from "next-intl";

import {
  ColorSchemeScript,
  MantineProvider,
  mantineHtmlProps,
} from "@mantine/core";
import "dayjs/locale/ru";
import {
  DatesProvider,
  MonthPickerInput,
  DatePickerInput,
} from "@mantine/dates";

export const metadata: Metadata = {
  title: "Bondee",
  description: "Build bonds that last forever.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript
          nonce="8IBTHwOdqNKAWeKl7plt8g=="
          defaultColorScheme="auto"
        />
      </head>
      <body>
        <MantineProvider defaultColorScheme="auto">
          <NextIntlClientProvider>
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
