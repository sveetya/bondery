/**
 * Application configuration constants
 */

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
