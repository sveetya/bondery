"use client";

import { useChat } from "@ai-sdk/react";
import {
  buildApiErrorFromResponse,
  extractApiErrorFields,
  getUserFacingError,
  isApiError,
} from "@bondery/helpers/api";
import { WEBAPP_ROUTES } from "@bondery/helpers/globals/paths";
import { errorNotificationTemplate } from "@bondery/mantine-next";
import { ActionIcon, Box, Button, Group, Stack, Text, TextInput } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconMessageChatbot, IconSend } from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";
import { DefaultChatTransport } from "ai";
import { notFound, usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PageHeader } from "@/components/shell/PageHeader";
import { useUserSession } from "@/components/shell/UserSessionProvider";
import { useChatPageTranslations, useCommonTranslations } from "@/lib/i18n/generated/hooks";
import {
  useChatSessionMessagesQuery,
  useChatSessionsRefreshOnStreamEnd,
  useCreateChatSessionMutation,
} from "@/lib/query/hooks/useChat";
import { useSubscriptionQuery } from "@/lib/query/hooks/useSubscription";
import { chatKeys } from "@/lib/query/keys";
import { ChatMessage } from "./components/message/ChatMessage";
import { ChatQuotaAlert } from "./components/quota/ChatQuotaAlert";
import { ChatQuotaBadge } from "./components/quota/ChatQuotaBadge";
import { useChatSessions } from "./hooks/ChatSessionsContext";

const SUGGESTED_PROMPT_KEYS = [
  "NotTalkedInAWhile",
  "ContactsInNewYork",
  "CoffeeWithBlake",
  "WhoSpeaksSpanish",
  "CreateNewContact",
  "InteractionsThisWeek",
] as const;

function chatSessionIdFromPathname(pathname: string): string | undefined {
  const prefix = `${WEBAPP_ROUTES.CHAT}/`;
  if (!pathname.startsWith(prefix)) {
    return undefined;
  }

  const sessionId = pathname.slice(prefix.length).split("/")[0];
  return sessionId || undefined;
}

function jsonPayloadFromTransportError(error: unknown): string {
  const bodyText = error instanceof Error ? error.message : String(error);
  const jsonStart = bodyText.indexOf("{");
  const jsonEnd = bodyText.lastIndexOf("}");
  if (jsonStart >= 0 && jsonEnd > jsonStart) {
    return bodyText.slice(jsonStart, jsonEnd + 1);
  }
  return bodyText;
}

function chatTransportErrorToApiError(error: unknown) {
  const bodyText = jsonPayloadFromTransportError(error);
  const fields = extractApiErrorFields(bodyText);
  if (!fields.code) {
    return error;
  }
  const status =
    fields.code === "chat_quota_exceeded" ? 403 : fields.code === "service_unavailable" ? 503 : 500;
  return buildApiErrorFromResponse({ bodyText, status });
}

function chatQuotaResetAt(error: unknown): string | undefined {
  const bodyText = jsonPayloadFromTransportError(error);
  try {
    const parsed = JSON.parse(bodyText) as {
      error?: { details?: { resetAt?: unknown } };
    };
    return typeof parsed.error?.details?.resetAt === "string"
      ? parsed.error.details.resetAt
      : undefined;
  } catch {
    return undefined;
  }
}

export function ChatClient() {
  const t = useChatPageTranslations();
  const tCommon = useCommonTranslations();
  const router = useRouter();
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const routeSessionId = chatSessionIdFromPathname(pathname);
  const { avatarUrl: userAvatarUrl, displayName: userName } = useUserSession();
  const { data: subscriptionStatus = null } = useSubscriptionQuery();
  const {
    data: hydratedMessages,
    error: messagesError,
    isError: isMessagesError,
    isSuccess: isMessagesSuccess,
  } = useChatSessionMessagesQuery(routeSessionId, !!routeSessionId);
  const suggestedPrompts = useMemo(
    () => SUGGESTED_PROMPT_KEYS.map((key) => t(`SuggestedPrompts.${key}`)),
    [t],
  );
  const { chatResetKey, setHighlightedSessionId } = useChatSessions();
  const createChatSessionMutation = useCreateChatSessionMutation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageDatesRef = useRef<Map<string, Date>>(new Map());
  const [inputValue, setInputValue] = useState("");
  const [messagesSent, setMessagesSent] = useState(0);
  // resetAt captured from a 403 response — more up-to-date than the SSR prop.
  const [serverResetAt, setServerResetAt] = useState<string | null>(null);
  const [quotaExceeded, setQuotaExceeded] = useState(
    subscriptionStatus ? !subscriptionStatus.canUseChat : false,
  );
  // Tracks the active session ID — can be set after lazy creation
  const sessionIdRef = useRef<string | undefined>(routeSessionId);
  const createdSessionIdRef = useRef<string | undefined>(undefined);

  const notifyChatErrorRef = useRef<(error: unknown) => void>(() => {});
  notifyChatErrorRef.current = (error: unknown) => {
    notifications.show(
      errorNotificationTemplate({
        description: getUserFacingError(error, tCommon),
        title: tCommon("feedback.errorTitle"),
      }),
    );
  };

  const { messages, sendMessage, status, setMessages } = useChat({
    onError: (error) => {
      const apiError = chatTransportErrorToApiError(error);

      if (
        (isApiError(apiError) &&
          (apiError.code === "chat_quota_exceeded" || apiError.status === 403)) ||
        (error instanceof Error && error.message.includes("403"))
      ) {
        setQuotaExceeded(true);
        const resetAt = chatQuotaResetAt(error);
        if (resetAt) {
          setServerResetAt(resetAt);
        }
        return;
      }

      notifyChatErrorRef.current(apiError);
    },
    transport: useMemo(
      () =>
        new DefaultChatTransport({
          api: "/api/chat",
          body: () => (sessionIdRef.current ? { sessionId: sessionIdRef.current } : {}),
        }),
      [],
    ),
  });

  const isLoading = status === "submitted" || status === "streaming";

  const getSessionId = useCallback(() => sessionIdRef.current, []);

  useChatSessionsRefreshOnStreamEnd(status, getSessionId, () => {
    setMessagesSent((n) => n + 1);
  });

  useEffect(() => {
    if (createdSessionIdRef.current && createdSessionIdRef.current === routeSessionId) {
      return;
    }

    if (!routeSessionId) {
      if (createdSessionIdRef.current) {
        return;
      }

      sessionIdRef.current = undefined;
      setMessages([]);
      setInputValue("");
      messageDatesRef.current.clear();
      return;
    }

    if (createdSessionIdRef.current && createdSessionIdRef.current !== routeSessionId) {
      createdSessionIdRef.current = undefined;
    }

    sessionIdRef.current = routeSessionId;

    if (!isMessagesSuccess) {
      return;
    }

    setMessages(hydratedMessages ?? []);
    messageDatesRef.current.clear();
  }, [hydratedMessages, isMessagesSuccess, routeSessionId, setMessages]);

  // Reset chat state when sidebar "new chat" is clicked (chatResetKey changes)
  const prevResetKeyRef = useRef(chatResetKey);
  useEffect(() => {
    if (chatResetKey !== prevResetKeyRef.current) {
      prevResetKeyRef.current = chatResetKey;
      createdSessionIdRef.current = undefined;
      setMessages([]);
      setInputValue("");
      setMessagesSent(0);
      setServerResetAt(null);
      setQuotaExceeded(subscriptionStatus ? !subscriptionStatus.canUseChat : false);
      messageDatesRef.current.clear();
      sessionIdRef.current = undefined;
    }
  }, [chatResetKey, setMessages, subscriptionStatus]);

  useEffect(() => {
    if (status === "submitted" || status === "streaming") {
      return;
    }

    const createdId = createdSessionIdRef.current;
    if (!createdId) {
      return;
    }

    const targetPath = `${WEBAPP_ROUTES.CHAT}/${createdId}`;
    if (pathname === targetPath) {
      return;
    }

    if (pathname !== WEBAPP_ROUTES.CHAT) {
      return;
    }

    queryClient.setQueryData(chatKeys.messages(createdId), messages);
    router.replace(targetPath);
  }, [messages, pathname, queryClient, router, status]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    // Stamp any newly-seen messages with the current time
    const now = new Date();
    for (const msg of messages) {
      if (!messageDatesRef.current.has(msg.id)) {
        messageDatesRef.current.set(msg.id, now);
      }
    }
  }, [messages]);

  function handleSuggestedPrompt(prompt: string) {
    setInputValue(prompt);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = inputValue.trim();
    if (!text || isLoading) {
      return;
    }

    // Create the session first, then send. Do not change the URL until the
    // stream settles — Next.js treats /app/chat → /app/chat/[id] as a real
    // navigation and would abort POST /api/chat.
    if (!sessionIdRef.current) {
      try {
        const sessionId = await createChatSessionMutation.mutateAsync();
        createdSessionIdRef.current = sessionId;
        sessionIdRef.current = sessionId;
        setHighlightedSessionId(sessionId);
      } catch (error) {
        notifyChatErrorRef.current(error);
        return;
      }
    }

    sendMessage({ text });
    setInputValue("");
  }

  // Called by the checkout hook's success event to clear the quota-exceeded state.
  const handleUpgradeSuccess = useCallback(() => {
    setQuotaExceeded(false);
  }, []);

  // Compute adjusted subscription status with client-side message count
  const adjustedSubscriptionStatus = useMemo(() => {
    if (!subscriptionStatus || messagesSent === 0) {
      return subscriptionStatus ?? null;
    }
    const updatedUsed = subscriptionStatus.aiMessagesUsed + messagesSent;
    return {
      ...subscriptionStatus,
      aiMessagesUsed: updatedUsed,
      canUseChat: updatedUsed < subscriptionStatus.aiMessageLimit,
    };
  }, [subscriptionStatus, messagesSent]);

  // Derive quotaExceeded from the optimistic counter so the input blocks
  // immediately without waiting for a server round-trip.
  useEffect(() => {
    if (!adjustedSubscriptionStatus) {
      return;
    }
    if (!adjustedSubscriptionStatus.canUseChat) {
      setQuotaExceeded(true);
    }
  }, [adjustedSubscriptionStatus]);

  if (
    routeSessionId &&
    isMessagesError &&
    hydratedMessages === undefined &&
    isApiError(messagesError) &&
    messagesError.status === 404
  ) {
    notFound();
  }

  return (
    <Box
      style={{
        display: "flex",
        flex: 1,
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      <Box p="xl" pb="md" style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        <Stack gap="xl">
          <PageHeader
            helpDoc="concepts.chat"
            helpLabel={t("description")}
            icon={IconMessageChatbot}
            title={t("title")}
          />
          <Box style={{ margin: "0 auto", maxWidth: 800, width: "100%" }}>
            <Stack gap="md">
              {messages.length === 0 ? (
                <Box py="xl">
                  <Text c="dimmed" mb="lg" ta="center">
                    {t("emptyState")}
                  </Text>
                  <Group gap="sm" justify="center" wrap="wrap">
                    {suggestedPrompts.map((prompt) => (
                      <Button
                        key={prompt}
                        onClick={() => handleSuggestedPrompt(prompt)}
                        radius="xl"
                        size="sm"
                        variant="light"
                      >
                        {prompt}
                      </Button>
                    ))}
                  </Group>
                </Box>
              ) : (
                messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    sentAt={messageDatesRef.current.get(message.id)}
                    userAvatarUrl={userAvatarUrl}
                    userName={userName}
                  />
                ))
              )}
              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <Box pl="md">
                  <Text c="dimmed" fs="italic" size="sm">
                    {t("thinking")}
                  </Text>
                </Box>
              )}
            </Stack>
            <div ref={messagesEndRef} />
          </Box>
        </Stack>
      </Box>

      <Box
        px="xl"
        py="md"
        style={{
          backgroundColor: "var(--mantine-color-body)",
          borderTop: "1px solid var(--mantine-color-default-border)",
          flexShrink: 0,
        }}
      >
        <Box style={{ margin: "0 auto", maxWidth: 800, width: "100%" }}>
          {quotaExceeded ? (
            <ChatQuotaAlert
              onSuccess={handleUpgradeSuccess}
              resetAt={serverResetAt ?? subscriptionStatus?.aiMonthlyResetAt}
              variant={subscriptionStatus?.plan === "premium" ? "premium" : "free"}
            />
          ) : (
            <>
              {adjustedSubscriptionStatus && (
                <Box mb="xs" style={{ display: "flex", justifyContent: "center" }}>
                  <ChatQuotaBadge subscriptionStatus={adjustedSubscriptionStatus} />
                </Box>
              )}
              <form onSubmit={handleSubmit}>
                <Group align="flex-end" gap="sm">
                  <TextInput
                    disabled={isLoading}
                    flex={1}
                    onChange={(e) => setInputValue(e.currentTarget.value)}
                    placeholder={t("inputPlaceholder")}
                    radius="xl"
                    rightSection={
                      <ActionIcon
                        aria-label={t("send")}
                        disabled={isLoading || !inputValue.trim()}
                        radius="xl"
                        size="md"
                        type="submit"
                        variant="filled"
                      >
                        <IconSend size={16} />
                      </ActionIcon>
                    }
                    rightSectionWidth={42}
                    value={inputValue}
                  />
                </Group>
              </form>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
}
