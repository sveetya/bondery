/**
 * Local dev ports — "Dial BOND" (B-O-N-D = 2-6-6-3 on a phone keypad).
 * Dev-only; production uses host `PORT` env and public domains.
 */

/** Bondery first-party HTTP dev servers (2663x block). */
export const DEV_PORTS = {
  /** Reserved: internal admin / one-off dev utilities */
  ADMIN: 26638,
  API: 26631,
  EMAIL_PREVIEW: 26639,
  EXTENSION: 26633,
  MOBILE: 26634,
  /** Local dev Postgres (`deploy/bondery/docker-compose.dev-db.yml`) */
  POSTGRES: 54322,
  /** Local API Redis (`apps/redis`) */
  REDIS: 26636,
  /** Reserved: Storybook / component docs */
  STORYBOOK: 26635,
  /** Reserved: Swagger UI dev server */
  SWAGGER_UI: 26637,
  WEBAPP: 26632,
  WEBSITE: 26630,
} as const;

/** Local Redis URL when `npm run start -w redis` is running. */
export const DEV_REDIS_URL = `redis://127.0.0.1:${DEV_PORTS.REDIS}` as const;

export const DEV_URLS = {
  api: `http://localhost:${DEV_PORTS.API}`,
  emailPreview: `http://localhost:${DEV_PORTS.EMAIL_PREVIEW}`,
  extension: `http://localhost:${DEV_PORTS.EXTENSION}`,
  mobile: `http://localhost:${DEV_PORTS.MOBILE}`,
  postgres: `postgresql://postgres:password@127.0.0.1:${DEV_PORTS.POSTGRES}/bondery`,
  redis: DEV_REDIS_URL,
  webapp: `http://localhost:${DEV_PORTS.WEBAPP}`,
  website: `http://localhost:${DEV_PORTS.WEBSITE}`,
} as const;

export const DEV_SYNC_WS_URL = `ws://localhost:${DEV_PORTS.API}/api/sync/ws`;
