export type AnalyticsLoginMethod = "oauth_github" | "oauth_linkedin" | "passkey";

/**
 * Better Auth `lastLoginMethod` stores OAuth callback ids (`github`, `linkedin`)
 * and `"passkey"` after `/passkey/verify-authentication`.
 */
export function isLastUsedOAuthProvider(
  lastMethod: string | null,
  provider: "github" | "linkedin",
): boolean {
  if (!lastMethod) {
    return false;
  }

  if (provider === "github") {
    return lastMethod === "github";
  }

  return lastMethod === "linkedin" || lastMethod === "linkedin_oidc";
}

export function isLastUsedPasskey(lastMethod: string | null): boolean {
  return lastMethod === "passkey";
}

export function resolveAnalyticsLoginMethod(
  lastMethod: string | null,
): AnalyticsLoginMethod | undefined {
  if (lastMethod === "passkey") {
    return "passkey";
  }

  if (lastMethod === "github") {
    return "oauth_github";
  }

  if (lastMethod === "linkedin" || lastMethod === "linkedin_oidc") {
    return "oauth_linkedin";
  }

  return undefined;
}
