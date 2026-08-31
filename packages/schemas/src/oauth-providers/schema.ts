import { z } from "zod";
import type { OAuthProviderId, OAuthProvidersBitmap, OAuthProvidersResponse } from "./types.js";

export const oauthProviderIdSchema = z.enum([
  "github",
  "linkedin",
]) satisfies z.ZodType<OAuthProviderId>;

export const oauthProvidersBitmapSchema = z
  .object({
    github: z.boolean(),
    linkedin: z.boolean(),
  })
  .strict() satisfies z.ZodType<OAuthProvidersBitmap>;

export const oauthProvidersResponseSchema = z
  .object({
    oauthProviders: oauthProvidersBitmapSchema,
  })
  .strict()
  .meta({
    example: {
      oauthProviders: {
        github: true,
        linkedin: true,
      },
    },
  }) satisfies z.ZodType<OAuthProvidersResponse>;
