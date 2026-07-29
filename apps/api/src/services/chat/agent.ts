import type { ServerResponse } from "node:http";
import { isStepCount, type ModelMessage, streamText } from "ai";
import type { DomainContext } from "../../domains/_shared/context.js";
import { getChatModel } from "./provider.js";
import { SYSTEM_PROMPT } from "./system-prompt.js";
import { createContactTools } from "./tools/contacts.js";
import { createGroupTools } from "./tools/groups.js";
import { createInteractionTools } from "./tools/interactions.js";
import { createSharingTools } from "./tools/sharing.js";
import { createTagTools } from "./tools/tags.js";

/**
 * Runs the AI chat agent with the given messages and domain context.
 * Returns a streaming text response using the Vercel AI SDK.
 */
export function runChatAgent(
  messages: ModelMessage[],
  ctx: DomainContext,
): {
  pipeUIMessageStreamToResponse: (response: ServerResponse) => void;
  text: PromiseLike<string>;
} {
  const contactTools = createContactTools(ctx);
  const interactionTools = createInteractionTools(ctx);
  const groupTools = createGroupTools(ctx);
  const tagTools = createTagTools(ctx);
  const sharingTools = createSharingTools(ctx);

  const today = new Date().toISOString().split("T")[0];

  return streamText({
    instructions: `${SYSTEM_PROMPT}\n\nToday's date: ${today}`,
    messages,
    model: getChatModel(),
    stopWhen: isStepCount(5),
    tools: {
      ...contactTools,
      ...interactionTools,
      ...groupTools,
      ...tagTools,
      ...sharingTools,
    },
  });
}
