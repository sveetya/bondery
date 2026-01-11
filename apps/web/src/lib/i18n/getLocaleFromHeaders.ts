import { headers } from "next/headers";
import { SUPPORTED_LOCALES, type SupportedLocale } from "@bondee/translations";

/**
 * Gets the preferred locale from the browser's Accept-Language header.
 * Falls back to 'en' if no supported locale is found.
 *
 * @returns The detected locale from browser headers
 */
export async function getLocaleFromHeaders(): Promise<SupportedLocale> {
  const headersList = await headers();
  const acceptLanguage = headersList.get("accept-language");

  if (!acceptLanguage) {
    return "en";
  }

  // Parse Accept-Language header (e.g., "cs-CZ,cs;q=0.9,en;q=0.8")
  const languages = acceptLanguage
    .split(",")
    .map((lang) => {
      const [code, qValue] = lang.trim().split(";q=");
      return {
        code: code.split("-")[0].toLowerCase(), // Get just the language code (e.g., "cs" from "cs-CZ")
        quality: qValue ? parseFloat(qValue) : 1.0,
      };
    })
    .sort((a, b) => b.quality - a.quality);

  // Find the first supported locale
  for (const lang of languages) {
    if (SUPPORTED_LOCALES.includes(lang.code as SupportedLocale)) {
      return lang.code as SupportedLocale;
    }
  }

  return "en";
}
