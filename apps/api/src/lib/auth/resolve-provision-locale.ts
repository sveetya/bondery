import { resolveRequestLocale } from "@bondery/helpers/locale/resolve-request-locale";
import { DEFAULT_LOCALE, type SupportedLocale } from "@bondery/schemas/locale/supported-locale";
import type { GenericEndpointContext } from "better-auth";

export function resolveHeadersFromAuthContext(ctx: GenericEndpointContext | undefined): Headers {
  if (!ctx) {
    return new Headers();
  }

  if (ctx.headers) {
    return ctx.headers instanceof Headers ? ctx.headers : new Headers(ctx.headers);
  }

  if (ctx.request?.headers) {
    return ctx.request.headers;
  }

  return new Headers();
}

/** Locale for new user provisioning from the signup request's Accept-Language. */
export function resolveProvisionLocaleFromContext(
  ctx: GenericEndpointContext | undefined,
): SupportedLocale {
  const headers = resolveHeadersFromAuthContext(ctx);
  if (!headers.get("accept-language")) {
    return DEFAULT_LOCALE;
  }

  return resolveRequestLocale(headers);
}
