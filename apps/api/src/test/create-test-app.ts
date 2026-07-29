import { buildApp } from "../build-app.js";
import { registerAuthRoutes } from "../lib/auth/routes.js";

export async function createTestApp() {
  const app = await buildApp();
  await registerAuthRoutes(app);
  await app.ready();
  return app;
}
