import type { ApiErrorTranslateFn } from "./types.js";

export function getBetterAuthUserMessage(code: string, t: ApiErrorTranslateFn): string {
  return t(`errors.auth.${code}` as "errors.unknown", {
    defaultValue: t("errors.unknown"),
  });
}

export function isBetterAuthClientError(error: unknown): error is { code: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code: unknown }).code === "string"
  );
}
