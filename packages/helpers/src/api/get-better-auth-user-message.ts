import type { ApiErrorTranslateFn } from "./types.js";

export function getBetterAuthUserMessage(code: string, t: ApiErrorTranslateFn): string {
  return t(`errors.auth.${code}` as "errors.unknown", {
    defaultValue: t("errors.unknown"),
  });
}

export function isBetterAuthClientError(
  error: unknown,
): error is { code?: string; status?: number } {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  if ("code" in error && typeof (error as { code: unknown }).code === "string") {
    return true;
  }

  return "status" in error && typeof (error as { status: unknown }).status === "number";
}

export function resolveBetterAuthErrorCode(error: { code?: string; status?: number }): string {
  if (error.code) {
    return error.code;
  }

  if (error.status === 429) {
    return "TOO_MANY_REQUESTS";
  }

  return "UNKNOWN";
}
