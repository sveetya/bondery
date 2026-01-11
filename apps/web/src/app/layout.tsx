import type { Metadata } from "next";
import "./globals.css";
import { Notifications } from "@mantine/notifications";
import { ModalsProvider } from "@mantine/modals";
import { NextIntlClientProvider } from "next-intl";
import { bondeeTheme } from "@bondee/branding/theme";

import { ColorSchemeScript, MantineProvider, mantineHtmlProps } from "@mantine/core";
import "dayjs/locale/en";
import { DatesProvider } from "@mantine/dates";

/**
 * Force dynamic rendering for the root layout
 * This is necessary because we fetch user settings which uses cookies()
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Bondee",
  description: "Build bonds that last forever.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Get user language and timezone from settings
  let locale = "en";
  let userTimezone = "UTC";

  try {
    const { getAuthHeaders } = await import("@/lib/authHeaders");
    const { getBaseUrl } = await import("@/lib/config");
    const baseUrl = getBaseUrl();
    const headers = await getAuthHeaders();

    const response = await fetch(`${baseUrl}/api/settings`, {
      cache: "no-store",
      headers,
    });

    if (response.ok) {
      const result = await response.json();
      if (result?.data?.timezone) {
        userTimezone = result.data.timezone;
      }
      if (result?.data?.language) {
        locale = result.data.language;
      }
    }
  } catch (error) {
    // Silently fail and use defaults
    console.error("Failed to load user settings:", error);
  }

  // Load translation messages
  let messages;
  try {
    messages = (await import(`@bondee/translations/${locale}`)).default;
  } catch (error) {
    console.error(`Failed to load messages for locale ${locale}:`, error);
    messages = (await import(`@bondee/translations/en`)).default;
  }

  return (
    <html lang={locale} {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript nonce="8IBTHwOdqNKAWeKl7plt8g==" defaultColorScheme="auto" />
      </head>
      <body>
        <MantineProvider defaultColorScheme="auto" theme={bondeeTheme}>
          <ModalsProvider>
            <NextIntlClientProvider locale={locale} timeZone={userTimezone} messages={messages}>
              <DatesProvider settings={{ locale }}>
                <Notifications autoClose={5000} position="top-center" />
                {children}
              </DatesProvider>
            </NextIntlClientProvider>
          </ModalsProvider>
        </MantineProvider>
      </body>
    </html>
  );
}
