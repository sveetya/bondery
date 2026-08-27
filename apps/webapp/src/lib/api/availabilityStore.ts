"use client";

import { API_ROUTES, toBffApiPath } from "@bondery/helpers/globals/paths";
import { isApiUnavailableResponseStatus } from "@/lib/api/availability";

export type ApiConnectionRetryResult = "ok" | "unauthorized" | "unavailable";

/**
 * Session probe for stale `/app/unavailable` bookmarks.
 * Hop-down in the product shell is silent — this does not drive global chrome.
 */
export async function retryApiConnection(): Promise<ApiConnectionRetryResult> {
  try {
    const response = await fetch(toBffApiPath(API_ROUTES.ME_SESSION), {
      credentials: "include",
    });

    if (response.ok) {
      return "ok";
    }

    if (response.status === 401) {
      return "unauthorized";
    }

    if (isApiUnavailableResponseStatus(response.status)) {
      return "unavailable";
    }

    return "ok";
  } catch {
    return "unavailable";
  }
}
