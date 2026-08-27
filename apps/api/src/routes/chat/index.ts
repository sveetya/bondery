/**
 * Chat API Routes
 * Handles AI chat assistant streaming responses
 */

import { chatRequestSchema } from "@bondery/schemas";
import { standardErrorResponses } from "@bondery/schemas/http/responses";
import type { UIMessage } from "ai";
import { convertToModelMessages } from "ai";
import type { FastifyRequest } from "fastify";
import type { FastifyZodOpenApiSchema } from "fastify-zod-openapi";
import { z } from "zod";
import { domainContextFromRequest } from "../../lib/platform/domain-context.js";
import {
  badRequest,
  forbidden,
  serviceUnavailable,
} from "../../lib/platform/errors/http-errors.js";
import type { AppRoutePlugin } from "../../lib/platform/fastify-types.js";
import { AI_TIER } from "../../lib/platform/rate-limit.js";
import { runChatAgent } from "../../services/chat/agent.js";
import { resolveAnthropicApiKey } from "../../services/chat/provider.js";
import { checkAndIncrementQuota } from "../../services/chat/quota.js";
import {
  persistAssistantChatMessage,
  persistUserChatMessage,
  setChatSessionTitleIfEmpty,
} from "../../services/chat/sessions.js";
import { generateSessionTitle } from "../../services/chat/title.js";

export const chatRoutes: AppRoutePlugin = async (fastify) => {
  fastify.addHook("onRoute", (routeOptions) => {
    if (routeOptions.schema) {
      routeOptions.schema.tags = ["Chat"];
    }
  });

  /**
   * POST /api/chat - Stream an AI chat response
   */
  fastify.post(
    "/",
    {
      config: { rateLimit: AI_TIER },
      schema: {
        body: chatRequestSchema,
        description: "Stream an AI chat assistant response as Server-Sent Events.",
        response: {
          200: {
            content: {
              "text/event-stream": {
                schema: z.string(),
              },
            },
            description: "UI message event stream (text/event-stream)",
          },
          ...standardErrorResponses,
        },
      } satisfies FastifyZodOpenApiSchema,
    },
    async (
      request: FastifyRequest<{
        Body: { messages: UIMessage[]; sessionId: string };
      }>,
      reply,
    ) => {
      const ctx = domainContextFromRequest(request);
      const { messages, sessionId } = request.body;

      if (!sessionId) {
        throw badRequest("sessionId is required", "bad_request");
      }

      const lastUserMessage = messages[messages.length - 1];
      if (!lastUserMessage) {
        throw badRequest("messages is required", "validation_error");
      }

      const apiKey = resolveAnthropicApiKey(fastify.config.BONDERY_PRIVATE_ANTHROPIC_API_KEY);
      if (!apiKey) {
        request.log.error("Chat Anthropic API key is missing or still the env example placeholder");
        await persistUserChatMessage(ctx, sessionId, lastUserMessage);
        throw serviceUnavailable();
      }

      const quota = await checkAndIncrementQuota(ctx);
      if (!quota.allowed) {
        throw forbidden("Chat quota exceeded", "chat_quota_exceeded", {
          limit: quota.limit,
          messagesUsed: quota.messagesUsed,
          plan: quota.plan,
          resetAt: quota.resetAt,
        });
      }

      await persistUserChatMessage(ctx, sessionId, lastUserMessage);

      const modelMessages = await convertToModelMessages(messages).catch((err: unknown) => {
        request.log.error(err, "Failed to convert chat messages");
        throw badRequest("Invalid chat messages", "validation_error");
      });

      const result = runChatAgent(modelMessages, ctx, apiKey);

      const persistAssistant = Promise.resolve(result.text)
        .then(async (fullText) => {
          if (fullText) {
            await persistAssistantChatMessage(ctx, sessionId, fullText);
          }
          const userText =
            lastUserMessage.parts
              ?.filter((p): p is { type: "text"; text: string } => p.type === "text")
              .map((p) => p.text)
              .join(" ") ?? "";
          if (userText) {
            try {
              const title = await generateSessionTitle(userText, apiKey);
              if (title) {
                await setChatSessionTitleIfEmpty(ctx, sessionId, title);
              }
            } catch (err) {
              request.log.error(err, "Title generation failed");
            }
          }
        })
        .catch((err: unknown) => {
          request.log.error(err, "Failed to persist assistant chat message");
        });

      reply.hijack();
      try {
        await result.pipeUIMessageStreamToResponse(reply.raw);
      } catch (err) {
        request.log.error(err, "Chat stream failed");
      }

      void persistAssistant;
    },
  );
};
