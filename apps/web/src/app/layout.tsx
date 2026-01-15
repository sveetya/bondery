import type { Metadata } from "next";
import "./globals.css";
import { Notifications } from "@mantine/notifications";
import { ModalsProvider } from "@mantine/modals";
import { bonderyTheme } from "@bondery/branding/theme";
import { Lexend } from "next/font/google";

import { ColorSchemeScript, MantineProvider, mantineHtmlProps } from "@mantine/core";

/**
 * Root layout provides Mantine infrastructure only.
 * i18n is provided at the route group level:
 * - (app) layout: browser locale for login and public routes
 * - (app)/app layout: user settings locale for authenticated routes
 */
export const metadata: Metadata = {
  title: "Bondery",
  description: "Build bonds that last forever.",
};

const lexend = Lexend({
  subsets: ["latin"],
  variable: "--font-lexend",
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" {...mantineHtmlProps} className={lexend.variable}>
      <head>
        <ColorSchemeScript nonce="8IBTHwOdqNKAWeKl7plt8g==" defaultColorScheme="auto" />
      </head>
      <body>
        <MantineProvider defaultColorScheme="auto" theme={bonderyTheme}>
          <ModalsProvider>
            <Notifications autoClose={5000} position="top-center" />
            {children}
          </ModalsProvider>
        </MantineProvider>
      </body>
    </html>
  );
}
