/**
 * Extension API Routes
 * Handles browser extension integration for creating/updating contacts
 */

import type { AppRoutePlugin } from "../../lib/platform/fastify-types.js";
import { registerManifestRoute } from "./manifest-route.js";
import { registerPostRoute } from "./post-route.js";

export const extensionRoutes: AppRoutePlugin = async (fastify) => {
  fastify.addHook("onRoute", (routeOptions) => {
    if (routeOptions.schema) {
      routeOptions.schema.tags = ["Extension"];
    }
  });

  registerManifestRoute(fastify);
  registerPostRoute(fastify);
};
