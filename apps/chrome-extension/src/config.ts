/**
 * Chrome Extension Configuration
 *
 * Environment variables are automatically loaded by Parcel from:
 * - .env
 * - .env.local
 * - .env.[NODE_ENV]
 * - .env.[NODE_ENV].local
 */

export const config = {
  // App URL - automatically injected by Parcel based on NODE_ENV
  appUrl: process.env.APP_URL!,
} as const;
