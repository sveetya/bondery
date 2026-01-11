/**
 * Shared image validation utilities for avatar/photo uploads
 */

import { AVATAR_UPLOAD } from "./config";

export interface ImageValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates if a file's MIME type is allowed for image uploads
 * @param mimeType - The MIME type to validate
 * @returns Validation result with error message if invalid
 */
export function validateImageType(mimeType: string): ImageValidationResult {
  const isValid = (
    AVATAR_UPLOAD.allowedMimeTypes as readonly string[]
  ).includes(mimeType);

  if (!isValid) {
    return {
      isValid: false,
      error: `Invalid file type. Only images are allowed (${AVATAR_UPLOAD.allowedMimeTypes.join(
        ", "
      )}).`,
    };
  }

  return { isValid: true };
}

/**
 * Validates if a file's size is within the allowed limit
 * @param fileSize - The file size in bytes
 * @returns Validation result with error message if invalid
 */
export function validateImageSize(fileSize: number): ImageValidationResult {
  if (fileSize > AVATAR_UPLOAD.maxFileSize) {
    return {
      isValid: false,
      error: `File too large. Maximum size is ${AVATAR_UPLOAD.maxFileSizeMB}MB.`,
    };
  }

  return { isValid: true };
}

/**
 * Validates both file type and size for image uploads
 * @param file - The file to validate (can be File object or an object with type and size)
 * @returns Validation result with error message if invalid
 */
export function validateImageUpload(file: {
  type: string;
  size: number;
}): ImageValidationResult {
  // Validate file type
  const typeValidation = validateImageType(file.type);
  if (!typeValidation.isValid) {
    return typeValidation;
  }

  // Validate file size
  const sizeValidation = validateImageSize(file.size);
  if (!sizeValidation.isValid) {
    return sizeValidation;
  }

  return { isValid: true };
}
