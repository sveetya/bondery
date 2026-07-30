import { buildApp } from "../build-app.js";
import { registerAuthRoutes } from "../lib/auth/routes.js";
import { registerDefaultNotFoundHandler } from "../lib/platform/rate-limit.js";

export async function createTestApp() {
  const app = await buildApp();
  registerDefaultNotFoundHandler(app);
  await registerAuthRoutes(app);
  await app.ready();
  return app;
}
