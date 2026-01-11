import { LocaleProvider } from "@/components/UserLocaleProvider";
import { getLocaleFromHeaders } from "@/lib/i18n/getLocaleFromHeaders";

/**
 * Force dynamic rendering because we use headers() for locale detection
 */
export const dynamic = "force-dynamic";

/**
 * Layout for (app) route group - provides browser-based locale for login
 * and other public routes. The nested /app layout overrides this with
 * user settings for authenticated routes.
 */
export default async function AppGroupLayout({ children }: { children: React.ReactNode }) {
  // Get locale from browser's Accept-Language header
  const locale = await getLocaleFromHeaders();
  const timezone = "UTC";

  // Load translation messages
  let messages;
  try {
    messages = (await import(`@bondee/translations/${locale}`)).default;
  } catch (error) {
    console.error(`Failed to load messages for locale ${locale}:`, error);
    messages = (await import(`@bondee/translations/en`)).default;
  }

  return (
    <LocaleProvider locale={locale} timezone={timezone} messages={messages}>
      {children}
    </LocaleProvider>
  );
}
