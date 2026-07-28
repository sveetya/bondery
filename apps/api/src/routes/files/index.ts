import type { FastifyReply, FastifyRequest } from "fastify";
import type { FastifyZodOpenApiSchema } from "fastify-zod-openapi";
import { z } from "zod";
import type { AppRoutePlugin } from "../../lib/platform/fastify-types.js";
import { notFound } from "../../lib/platform/errors/http-errors.js";
import { getStorage } from "../../lib/storage/index.js";

/**
 * Serves files from LocalDiskStorage (public-read buckets: avatars, linkedin_logos).
 * When STORAGE_DRIVER=s3, clients use the CDN/S3 public URL directly.
 */
export const filesRoutes: AppRoutePlugin = async (fastify) => {
  fastify.get(
    "/:bucket/*",
    {
      schema: {
        description: "Serve a public storage object (avatars, linkedin_logos).",
        params: z.object({
          "*": z.string(),
          bucket: z.enum(["avatars", "linkedin_logos"]),
        }),
        response: {
          200: { content: { "image/jpeg": { schema: z.any() } }, description: "File bytes" },
        },
      } satisfies FastifyZodOpenApiSchema,
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const params = request.params as { bucket: string; "*": string };
      const bucket = params.bucket;
      const key = params["*"];

      if (!bucket || !key) {
        throw notFound("File not found", "not_found");
      }

      const storage = getStorage();
      const data = await storage.get(bucket, key);
      if (!data) {
        throw notFound("File not found", "not_found");
      }

      const contentType = key.endsWith(".png")
        ? "image/png"
        : key.endsWith(".webp")
          ? "image/webp"
          : "image/jpeg";

      reply.header("Cache-Control", "public, max-age=86400");
      return reply.type(contentType).send(data);
    },
  );
};
