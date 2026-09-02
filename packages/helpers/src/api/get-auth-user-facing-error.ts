import { isApiErrorCode } from "@bondery/schemas/errors";
import { isApiError } from "./ApiError.js";
import {
  getBetterAuthUserMessage,
  isBetterAuthClientError,
  resolveBetterAuthErrorCode,
} from "./get-better-auth-user-message.js";
import { getUserFacingError } from "./get-user-facing-error.js";
import type { ApiErrorTranslateFn } from "./types.js";

/**
 * Maps Better Auth client errors, ApiErrors, and generic failures to user-facing copy.
 */
export function getAuthUserFacingError(error: unknown, t: ApiErrorTranslateFn): string {
  if (isApiError(error)) {
    return error.getUserMessage(t);
  }

  if (isBetterAuthClientError(error)) {
    const code = resolveBetterAuthErrorCode(error);
    if (code === "UNKNOWN") {
      return getUserFacingError(error, t);
    }

    if (isApiErrorCode(code)) {
      return t(`errors.api.${code}`, {
        defaultValue: t("errors.unknown"),
      });
    }

    return getBetterAuthUserMessage(code, t);
  }

  return getUserFacingError(error, t);
}
