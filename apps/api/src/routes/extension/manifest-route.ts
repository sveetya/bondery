import { CHROME_EXTENSION_URL, MIN_EXTENSION_VERSION } from "@bondery/helpers";
import type { FastifyZodOpenApiSchema } from "fastify-zod-openapi";
import type { AppFastifyInstance } from "../../lib/platform/fastify-types.js";
import { withOkResponse } from "../../lib/platform/openapi/responses.js";
import { extensionManifestSchema } from "./schemas.js";

export function registerManifestRoute(fastify: AppFastifyInstance): void {
  fastify.get(
    "/manifest",
    {
      config: { rateLimit: false },
      schema: {
        description:
          "Public Chrome extension configuration. Returns the minimum supported extension version and store URL. " +
          "Not a health probe — use `GET /health/live` for liveness.",
        response: withOkResponse(extensionManifestSchema, "Extension manifest"),
        tags: ["Extension"],
      } satisfies FastifyZodOpenApiSchema,
    },
    async () => {
      return {
        extension: {
          minVersion: MIN_EXTENSION_VERSION,
          storeUrl: CHROME_EXTENSION_URL,
        },
      };
    },
  );
}
