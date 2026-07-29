import type { Prisma } from "@bondery/db";
import type { ChatMessage, ChatSession } from "@bondery/schemas";
import type { UIMessage } from "ai";
import type { DomainContext } from "../../domains/_shared/context.js";
import { domainDb } from "../../domains/_shared/domain-db.js";
import { internal } from "../../lib/platform/errors/http-errors.js";

function toChatSessionDto(row: {
  id: string;
  userId: string;
  title: string | null;
  createdAt: Date;
  updatedAt: Date;
}): ChatSession {
  return {
    createdAt: row.createdAt.toISOString(),
    id: row.id,
    title: row.title,
    updatedAt: row.updatedAt.toISOString(),
    userId: row.userId,
  };
}

export async function createChatSession(ctx: DomainContext) {
  const { user } = ctx;
  const db = domainDb(ctx);

  try {
    const row = await db.chatSession.create({
      data: { userId: user.id },
    });
    return toChatSessionDto(row);
  } catch (error) {
    throw internal(
      "chat_session_failed_to_create_session",
      error instanceof Error ? error.message : undefined,
    );
  }
}

export async function updateChatSessionTitle(ctx: DomainContext, sessionId: string, title: string) {
  const { user } = ctx;
  const db = domainDb(ctx);

  try {
    const row = await db.chatSession.update({
      data: { title },
      where: { id: sessionId, userId: user.id },
    });
    return toChatSessionDto(row);
  } catch (error) {
    throw internal(
      "chat_session_failed_to_update_session",
      error instanceof Error ? error.message : undefined,
    );
  }
}

export async function deleteChatSession(ctx: DomainContext, sessionId: string): Promise<void> {
  const { user } = ctx;
  const db = domainDb(ctx);

  const result = await db.chatSession.deleteMany({
    where: { id: sessionId, userId: user.id },
  });

  if (result.count === 0) {
    throw internal("chat_session_failed_to_delete_session");
  }
}

export async function persistChatMessages(
  ctx: DomainContext,
  sessionId: string,
  userMessage: UIMessage,
  assistantText: string,
): Promise<void> {
  const { user } = ctx;
  const db = domainDb(ctx);

  const userText =
    userMessage.parts
      ?.filter((p): p is { type: "text"; text: string } => p.type === "text")
      .map((p) => p.text)
      .join(" ") ?? "";

  const userContent = { text: userText } satisfies Prisma.InputJsonValue;
  const assistantContent = { text: assistantText } satisfies Prisma.InputJsonValue;

  const { count } = await db.chatSession.updateMany({
    data: { updatedAt: new Date() },
    where: { id: sessionId, userId: user.id },
  });

  if (count === 0) {
    ctx.log?.error({ sessionId }, "Failed to update chat session timestamp — session not found");
    return;
  }

  try {
    await db.chatMessage.createMany({
      data: [
        {
          content: userContent,
          role: "user",
          sessionId,
        },
        {
          content: assistantContent,
          role: "assistant",
          sessionId,
        },
      ],
    });
  } catch (error) {
    ctx.log?.error({ err: error }, "Failed to save chat messages");
  }
}

export async function setChatSessionTitleIfEmpty(
  ctx: DomainContext,
  sessionId: string,
  title: string,
): Promise<void> {
  const { user } = ctx;
  const db = domainDb(ctx);

  if (!title) {
    return;
  }

  const session = await db.chatSession.findFirst({
    select: { title: true },
    where: { id: sessionId, userId: user.id },
  });

  if (session?.title) {
    return;
  }

  try {
    await db.chatSession.updateMany({
      data: { title },
      where: { id: sessionId, title: null, userId: user.id },
    });
  } catch (error) {
    ctx.log?.error({ err: error }, "Failed to set chat session title");
  }
}

export function toChatMessageDto(row: {
  id: string;
  sessionId: string;
  role: string;
  content: unknown;
  createdAt: Date;
}): ChatMessage {
  return {
    content: row.content,
    createdAt: row.createdAt.toISOString(),
    id: row.id,
    role: row.role,
    sessionId: row.sessionId,
  };
}
