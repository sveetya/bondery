/**
 * Strips plaintext magic-link tokens from logged URLs.
 * Better Auth puts the verify token in the query string.
 */
export function redactSensitiveAuthQuery(url: string): string {
  if (!/[?&]token=/i.test(url)) {
    return url;
  }

  return url.replace(/([?&]token=)[^&]*/gi, "$1REDACTED");
}

export function isMagicLinkVerifyPath(urlPath: string): boolean {
  const path = urlPath.split("?")[0] ?? urlPath;
  const normalized = path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
  return normalized.endsWith("/magic-link/verify");
}
