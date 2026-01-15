/**
 * Application configuration constants
 */

import { active } from "d3";

export const INPUT_MAX_LENGTHS = {
  firstName: 50,
  middleName: 50,
  lastName: 50,
  title: 100,
  place: 100,
  description: 500,
  dateName: 50,
} as const;

export const FEATURES = {
  birthdayNotifications: true,
} as const;

export const LIMITS = {
  maxImportantDates: 3,
} as const;

/**
 * Avatar upload configuration
 */
export const AVATAR_UPLOAD = {
  /** Allowed MIME types for avatar uploads */
  allowedMimeTypes: ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"] as const,
  /** Maximum file size in bytes (5MB) */
  maxFileSize: 5 * 1024 * 1024,
  /** Maximum file size in MB for display */
  maxFileSizeMB: 5,
} as const;

/**
 * Get the base URL based on the current environment
 */
export function getBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL;
  return `${url}`;
}

// Doherty treshold, used for max function reply time
export const MAX_DOHERTY_THRESHOLD = 0.7;

/**
 * Integration providers configuration
 */
export const INTEGRATION_PROVIDERS = [
  {
    provider: "github",
    providerKey: "github",
    displayName: "GitHub",
    iconColor: "dark",
    backgroundColor: "black",
    icon: "github",
    active: true,
  },
  {
    provider: "linkedin",
    providerKey: "linkedin_oidc",
    displayName: "LinkedIn",
    iconColor: "#0A66C2",
    backgroundColor: "#0A66C2",
    icon: "linkedin",
    active: true,
  },
] as const;

/**
 * Status page URL
 */
export const STATUS_URL = "https://bondery.openstatus.dev/";

/**
 * Social media links
 */
export const SOCIAL_LINKS = {
  github: "https://github.com/Marilok/bondery",
  linkedin: "https://www.linkedin.com/company/bondery",
  email: "team@usebondery.com",
} as const;

/**
 * Routes used across the app
 */
export const ROUTES = {
  LOGIN: "/login",
} as const;
