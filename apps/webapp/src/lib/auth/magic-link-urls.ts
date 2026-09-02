/** Same value as `RETURN_INTENT_PARAM` in `returnIntent.ts`. */
const RETURN_INTENT_PARAM = "redirect";

const TRANSIENT_AUTH_ERROR_PARAMS = ["error", "error_description"] as const;

/** Drops Better Auth verify-error params so they are not forwarded onto consent. */
export function searchWithoutTransientAuthErrors(search: string): string {
  const query = search.startsWith("?") ? search.slice(1) : search;
  if (!query) {
    return "";
  }

  const params = new URLSearchParams(query);
  for (const key of TRANSIENT_AUTH_ERROR_PARAMS) {
    params.delete(key);
  }
  return params.toString();
}

export function stripTransientAuthErrorFromLocation(): void {
  if (typeof window === "undefined") {
    return;
  }

  const url = new URL(window.location.href);
  let changed = false;
  for (const key of TRANSIENT_AUTH_ERROR_PARAMS) {
    if (url.searchParams.has(key)) {
      url.searchParams.delete(key);
      changed = true;
    }
  }
  if (!changed) {
    return;
  }

  window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
}

export function buildLoginMagicLinkUrls(
  origin: string,
  redirectParam: string | null,
): { callbackURL: string; errorCallbackURL: string } {
  const errorCallbackURL = new URL("/login", origin).toString();

  if (redirectParam?.startsWith("/oauth/consent") === true) {
    return {
      callbackURL: new URL(redirectParam, origin).toString(),
      errorCallbackURL,
    };
  }

  const startUrl = new URL("/auth/start", origin);
  if (redirectParam) {
    startUrl.searchParams.set(RETURN_INTENT_PARAM, redirectParam);
  }

  return {
    callbackURL: startUrl.toString(),
    errorCallbackURL,
  };
}

export function buildOAuthLoginMagicLinkUrls(
  origin: string,
  search: string,
): { callbackURL: string; errorCallbackURL: string } {
  const query = searchWithoutTransientAuthErrors(search);
  const callbackURL = new URL("/oauth/consent", origin);
  const errorCallbackURL = new URL("/oauth/login", origin);
  callbackURL.search = query;
  errorCallbackURL.search = query;
  return {
    callbackURL: callbackURL.toString(),
    errorCallbackURL: errorCallbackURL.toString(),
  };
}
