import { isApiError } from "@bondery/helpers/api";

export function isForbiddenApiError(error: unknown): boolean {
  return isApiError(error) && error.status === 403;
}
