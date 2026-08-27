/** Encrypted webapp OAuth-BFF session (server-only). */
export const WEBAPP_SESSION_COOKIE = "bondery_webapp_session";

/** Better Auth last-login-method cookie (`httpOnly: false`, parent domain). */
export const LAST_USED_LOGIN_METHOD_COOKIE = "better-auth.last_used_login_method";

/** Short-lived PKCE/state cookie for the webapp OAuth-BFF authorize hop. */
export const OAUTH_FLOW_COOKIE = "bondery_oauth_flow";

/** Pause after "Back online" before auto-navigating away from the unavailable page. */
export const OUTAGE_RESUME_DELAY_MS = 300;

/** Short-lived cookie: skip onboarding gate once after OAuth deep-link return. */
export const BYPASS_ONBOARDING_ONCE_COOKIE = "bondery:bypassOnboardingOnce";

export const REQUEST_PATHNAME_HEADER = "x-pathname";
export const REQUEST_SEARCH_HEADER = "x-search";
