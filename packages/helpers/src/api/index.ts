export { ApiError, isApiError, isUnauthorizedApiError } from "./ApiError.js";
export { getAuthUserFacingError } from "./get-auth-user-facing-error.js";
export { getBetterAuthUserMessage } from "./get-better-auth-user-message.js";
export { getUserFacingError } from "./get-user-facing-error.js";
export type { ParsedApiErrorFields } from "./parse-api-error.js";
export { buildApiErrorFromResponse, extractApiErrorFields } from "./parse-api-error.js";
export type { ApiErrorTranslateFn } from "./types.js";
