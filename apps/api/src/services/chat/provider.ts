import { createAnthropic } from "@ai-sdk/anthropic";

/**
 * Real Anthropic keys are `sk-ant-api03-…` and much longer than the env
 * example `sk-ant-<your-anthropic-api-key>`. Health only checks non-empty.
 */
const MIN_ANTHROPIC_API_KEY_LENGTH = 40;

export function resolveAnthropicApiKey(configValue: string | undefined): string | undefined {
  const key = (configValue ?? process.env.BONDERY_PRIVATE_ANTHROPIC_API_KEY ?? "").trim();
  if (key.length < MIN_ANTHROPIC_API_KEY_LENGTH) {
    return undefined;
  }
  return key;
}

/**
 * Creates the LLM provider instance for the chat agent.
 * Uses Anthropic Claude, abstracted via AI SDK for easy swapping.
 *
 * @returns An AI SDK-compatible language model.
 */
export function getChatModel(apiKey = process.env.BONDERY_PRIVATE_ANTHROPIC_API_KEY) {
  const anthropic = createAnthropic({
    apiKey,
  });

  return anthropic("claude-haiku-4-5");
}
