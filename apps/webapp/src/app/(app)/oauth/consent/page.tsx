"use client";

import { BETTER_AUTH_BASE_PATH } from "@bondery/helpers/globals/paths";
import { errorNotificationTemplate } from "@bondery/mantine-next";
import {
  Button,
  Card,
  Center,
  Divider,
  Group,
  List,
  ListItem,
  Loader,
  Stack,
  Text,
  ThemeIcon,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconShield, IconX } from "@tabler/icons-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createWebappAuthClient } from "@/lib/auth/client";
import { RETURN_INTENT_PARAM } from "@/lib/auth/returnIntent";
import { buildSignedOAuthQuery } from "@/lib/auth/signedOAuthQuery";
import { useOAuthConsentTranslations } from "@/lib/i18n/generated/hooks";
import { useWebappRuntimeConfig } from "@/lib/platform/runtimeConfig.client";

type OAuthClientDetails = {
  client_name?: string;
  client_id?: string;
};

function getRedirectUri(data: unknown): string | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  const candidate = data as { redirect_uri?: string; redirect_to?: string; url?: string };
  return candidate.redirect_uri ?? candidate.redirect_to ?? candidate.url ?? null;
}

/**
 * OAuth 2.1 consent page for the API authorization server (Better Auth).
 *
 * The AS redirects here with a signed `oauth_query` continuation on the URL.
 */
export default function OAuthConsentPage() {
  const t = useOAuthConsentTranslations();
  const searchParams = useSearchParams();
  const router = useRouter();
  const runtimeConfig = useWebappRuntimeConfig();
  const authClient = useMemo(() => createWebappAuthClient(runtimeConfig), [runtimeConfig]);
  const apiBaseUrl = runtimeConfig.apiBaseUrl.replace(/\/+$/, "");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authDetails, setAuthDetails] = useState<{
    client: { name: string };
    redirect_uri: string;
    scope: string;
  } | null>(null);
  const handledRef = useRef(false);
  const redirectingRef = useRef(false);

  const oauthQuery = useMemo(
    () => buildSignedOAuthQuery(searchParams.toString()) ?? "",
    [searchParams],
  );

  const fetchDetails = useCallback(async () => {
    if (!oauthQuery) {
      setError(t("MissingAuthorizationId"));
      setLoading(false);
      return;
    }

    if (handledRef.current || redirectingRef.current) {
      return;
    }

    handledRef.current = true;

    try {
      const session = await authClient.getSession();
      if (!session.data?.user) {
        redirectingRef.current = true;
        const consentPath = `/oauth/consent?${searchParams.toString()}`;
        router.push(`/login?${RETURN_INTENT_PARAM}=${encodeURIComponent(consentPath)}`);
        return;
      }

      const clientId = searchParams.get("client_id");
      if (!clientId) {
        setError(t("InvalidRequest"));
        setLoading(false);
        return;
      }

      const clientResponse = await fetch(
        `${apiBaseUrl}${BETTER_AUTH_BASE_PATH}/oauth2/get-client?client_id=${encodeURIComponent(clientId)}`,
        { credentials: "include" },
      );

      if (!clientResponse.ok) {
        setError(t("InvalidRequest"));
        setLoading(false);
        return;
      }

      const clientDetails = (await clientResponse.json()) as OAuthClientDetails;
      setAuthDetails({
        client: { name: clientDetails.client_name ?? clientId },
        redirect_uri: searchParams.get("redirect_uri") ?? "",
        scope: searchParams.get("scope") ?? "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("UnexpectedError"));
    } finally {
      if (!redirectingRef.current) {
        setLoading(false);
      }
    }
  }, [apiBaseUrl, authClient, oauthQuery, router, searchParams, t]);

  useEffect(() => {
    void fetchDetails();
  }, [fetchDetails]);

  async function submitConsent(accept: boolean) {
    if (!oauthQuery) {
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${apiBaseUrl}${BETTER_AUTH_BASE_PATH}/oauth2/consent`, {
        body: JSON.stringify({
          accept,
          oauth_query: oauthQuery,
        }),
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(body?.message ?? t("ErrorTitle"));
      }

      const data = await response.json();
      const redirectUrl = getRedirectUri(data);
      if (redirectUrl) {
        redirectingRef.current = true;
        window.location.href = redirectUrl;
      }
    } catch (err) {
      notifications.show(
        errorNotificationTemplate({
          description: err instanceof Error ? err.message : t("UnexpectedError"),
          title: t("ErrorTitle"),
        }),
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <Center mih="100vh">
        <Loader size="lg" />
      </Center>
    );
  }

  if (error || !authDetails) {
    return (
      <Center mih="100vh">
        <Card maw={480} p="xl" shadow="sm" w="100%">
          <Stack align="center" gap="md">
            <ThemeIcon color="red" radius="xl" size={48} variant="light">
              <IconX size={24} />
            </ThemeIcon>
            <Text fw={600} size="lg">
              {t("ErrorTitle")}
            </Text>
            <Text c="dimmed" size="sm" ta="center">
              {error ?? t("InvalidRequest")}
            </Text>
          </Stack>
        </Card>
      </Center>
    );
  }

  const scopes = authDetails.scope ? authDetails.scope.split(" ").filter(Boolean) : [];

  return (
    <Center mih="100vh">
      <Card maw={480} p="xl" shadow="sm" w="100%">
        <Stack gap="lg">
          <Group align="center" gap="sm">
            <ThemeIcon radius="xl" size={40} variant="light">
              <IconShield size={22} />
            </ThemeIcon>
            <Stack gap={0}>
              <Text fw={600} size="lg">
                {t("Title")}
              </Text>
              <Text c="dimmed" size="sm">
                {authDetails.client.name}
              </Text>
            </Stack>
          </Group>

          <Text size="sm">{t("Description", { clientName: authDetails.client.name })}</Text>

          <Divider />

          {scopes.length > 0 && (
            <Stack gap="xs">
              <Text fw={500} size="sm">
                {t("RequestedPermissions")}
              </Text>
              <List size="sm" spacing="xs">
                {scopes.map((scope) => (
                  <ListItem
                    icon={
                      <ThemeIcon color="blue" radius="xl" size={20} variant="light">
                        <IconCheck size={12} />
                      </ThemeIcon>
                    }
                    key={scope}
                  >
                    {t(`Scopes.${scope}`, { defaultValue: scope })}
                  </ListItem>
                ))}
              </List>
            </Stack>
          )}

          <Group grow>
            <Button
              disabled={submitting}
              loading={submitting}
              onClick={() => submitConsent(false)}
              variant="default"
            >
              {t("Deny")}
            </Button>
            <Button disabled={submitting} loading={submitting} onClick={() => submitConsent(true)}>
              {t("Approve")}
            </Button>
          </Group>
        </Stack>
      </Card>
    </Center>
  );
}
