import { z } from "zod";
import { createdAtSchema } from "#entities/_shared/schema.js";
import { EXAMPLE_LIVENESS_STATUS_RESPONSE } from "#openapi/fixtures/schema-examples.js";

const buildMetadataFields = {
  gitSha: z.string().optional(),
  version: z.string().optional(),
};

export const livenessStatusSchema = z
  .object({
    status: z.literal("ok"),
    timestamp: createdAtSchema,
    ...buildMetadataFields,
  })
  .meta({ example: EXAMPLE_LIVENESS_STATUS_RESPONSE });

export const readinessStatusOkSchema = z.object({
  status: z.literal("ok"),
  timestamp: createdAtSchema,
  ...buildMetadataFields,
});

export const readinessStatusUnhealthySchema = z.object({
  error: z.string(),
  status: z.literal("unhealthy"),
  timestamp: createdAtSchema,
  ...buildMetadataFields,
});

export const readinessStatusSchema = z.union([
  readinessStatusOkSchema,
  readinessStatusUnhealthySchema,
]);
