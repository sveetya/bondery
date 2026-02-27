/**
 * Chrome Extension Configuration
 *
 * Environment variables are automatically loaded by WXT from:
 * - .env
 * - .env.local
 * - .env.[mode]
 * - .env.[mode].local
 *
 * Variables prefixed with NEXT_PUBLIC_, VITE_, or WXT_ are available at runtime.
 */

export const config = {
  appUrl: import.meta.env.NEXT_PUBLIC_WEBAPP_URL || "http://localhost:3000",
} as const;
