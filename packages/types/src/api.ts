/**
 * API Types
 * Shared types for API requests and responses
 */

/**
 * Standard API error response
 */
export interface ApiErrorResponse {
  error: string;
  description?: string;
}

/**
 * Standard API success response
 */
export interface ApiSuccessResponse {
  success: true;
  message?: string;
}

/**
 * Photo upload response
 */
export interface PhotoUploadResponse {
  success: boolean;
  avatarUrl?: string;
  error?: string;
}

/**
 * Image validation result
 */
export interface ImageValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Redirect endpoint request body (from browser extension)
 */
export interface RedirectRequest {
  instagram?: string;
  linkedin?: string;
  facebook?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  profileImageUrl?: string;
  title?: string;
  place?: string;
}

/**
 * Redirect endpoint response
 */
export interface RedirectResponse {
  contactId: string;
  existed: boolean;
}
