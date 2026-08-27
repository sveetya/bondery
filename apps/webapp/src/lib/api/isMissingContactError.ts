import { isApiError } from "@bondery/helpers/api";

/** GET /contacts/:id uses `not_found`; merge and some nested routes use `contact_not_found`. */
export function isMissingContactError(error: unknown): boolean {
  if (isApiError(error)) {
    return error.code === "contact_not_found" || error.code === "not_found";
  }

  return error instanceof Error && error.message === "Contact not found";
}
