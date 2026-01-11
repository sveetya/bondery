import type { Metadata } from "next";
import "./globals.css";
import { Notifications } from "@mantine/notifications";
import { ModalsProvider } from "@mantine/modals";
import { bondeeTheme } from "@bondee/branding/theme";

import { ColorSchemeScript, MantineProvider, mantineHtmlProps } from "@mantine/core";

/**
 * Root layout provides Mantine infrastructure only.
 * i18n is provided at the route group level:
 * - (app) layout: browser locale for login and public routes
 * - (app)/app layout: user settings locale for authenticated routes
 */
export const metadata: Metadata = {
  title: "Bondee",
  description: "Build bonds that last forever.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript nonce="8IBTHwOdqNKAWeKl7plt8g==" defaultColorScheme="auto" />
      </head>
      <body>
        <MantineProvider defaultColorScheme="auto" theme={bondeeTheme}>
          <ModalsProvider>
            <Notifications autoClose={5000} position="top-center" />
            {children}
          </ModalsProvider>
        </MantineProvider>
      </body>
    </html>
  );
}
