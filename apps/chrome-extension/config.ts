/**
 * Chrome Extension Configuration
 *
 * Environment variables are loaded by WXT/Vite from:
 * - .env
 * - .env.local
 * - .env.[NODE_ENV]
 * - .env.[NODE_ENV].local
 *
 * Variables prefixed with NEXT_PUBLIC_ are exposed to the extension context.
 */

export const config = {
  appUrl: import.meta.env.NEXT_PUBLIC_WEBAPP_URL || "http://localhost:3002",
} as const;
