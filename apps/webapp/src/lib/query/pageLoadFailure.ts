import { isApiError } from "@bondery/helpers/api";
import { isApiUnavailableError } from "@/lib/api/availability";
import { isForbiddenApiError } from "@/lib/api/forbidden";
import { isMissingContactError } from "@/lib/api/isMissingContactError";
import { isUnauthorizedApiError } from "@/lib/auth/unauthorized";

/**
 * True when a page-defining query should hit `(shell)/error.tsx`.
 * False for 401 (login), missing contact (`PersonMissingState`), and 403 (page-owned UI).
 */
export function isPageLoadFailure(error: unknown): boolean {
  if (isUnauthorizedApiError(error) || isForbiddenApiError(error) || isMissingContactError(error)) {
    return false;
  }
  if (isApiUnavailableError(error)) {
    return true;
  }
  return isApiError(error) && error.status >= 500;
}

/** TanStack `throwOnError`: throw only when there is no cached data to keep on screen. */
export function throwIfPageCannotRender(
  error: unknown,
  query: { state: { data: unknown } },
): boolean {
  return query.state.data === undefined && isPageLoadFailure(error);
}
