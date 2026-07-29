import { resolveRequestLocale } from "@bondery/helpers/locale/resolve-request-locale";
import { DEFAULT_LOCALE, type SupportedLocale } from "@bondery/schemas/locale/supported-locale";
import type { GenericEndpointContext } from "better-auth";
import { getUserSettingsLanguage } from "./get-user-settings-language.js";
import { resolveHeadersFromAuthContext } from "./resolve-provision-locale.js";

/**
 * Locale for `@better-auth/i18n` — session language from user_settings, then Accept-Language.
 */
export async function resolveAuthLocale(ctx: GenericEndpointContext): Promise<SupportedLocale> {
  const sessionUserId = ctx.context.session?.user?.id;
  const sessionLanguage = sessionUserId ? await getUserSettingsLanguage(sessionUserId) : null;
  const headers = resolveHeadersFromAuthContext(ctx);

  if (headers.get("accept-language") || sessionLanguage) {
    return resolveRequestLocale(headers, sessionLanguage);
  }

  return DEFAULT_LOCALE;
}
