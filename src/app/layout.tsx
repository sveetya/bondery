import type { Metadata } from "next";
import "./globals.css";
import { Notifications } from "@mantine/notifications";
import { NextIntlClientProvider } from "next-intl";

import {
  ColorSchemeScript,
  MantineProvider,
  mantineHtmlProps,
} from "@mantine/core";

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
        <ColorSchemeScript />
      </head>
      <body>
        <MantineProvider>
          <NextIntlClientProvider>
            <Notifications />
            {children}
          </NextIntlClientProvider>
        </MantineProvider>
      </body>
    </html>
  );
}
