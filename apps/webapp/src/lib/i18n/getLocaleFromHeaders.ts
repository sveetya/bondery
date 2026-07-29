import { resolveLocaleFromAcceptLanguageHeader } from "@bondery/helpers/locale/resolve-request-locale";
import type { SupportedLocale } from "@bondery/translations";
import { headers } from "next/headers";

/**
 * Get locale from browser's Accept-Language header
 */
export async function getLocaleFromHeaders(): Promise<SupportedLocale> {
  const headersList = await headers();
  return resolveLocaleFromAcceptLanguageHeader(headersList.get("accept-language") || "");
}
