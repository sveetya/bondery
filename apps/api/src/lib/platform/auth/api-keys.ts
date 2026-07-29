/**
 * API key bearer detection for verifyAuth.
 */

import { API_KEY_PREFIX } from "@bondery/schemas";

export function isApiKeyBearerToken(token: string | undefined): boolean {
  return typeof token === "string" && token.startsWith(API_KEY_PREFIX);
}
