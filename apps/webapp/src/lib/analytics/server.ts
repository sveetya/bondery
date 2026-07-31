import { after } from "next/server";
import { PostHog } from "posthog-node";
import { WEBAPP_RUNTIME_ENV } from "../platform/runtimeConfig.env";

/**
 * Singleton PostHog Node client for server-side event capture.
 * `flushAt: 1` and `flushInterval: 0` ensure events are queued immediately;
 * `after()` flushes them after the response is sent (non-blocking).
 */
const posthogKey = process.env[WEBAPP_RUNTIME_ENV.posthogKey];
const posthogHost = process.env[WEBAPP_RUNTIME_ENV.posthogHost] ?? "https://eu.i.posthog.com";

const posthogClient = posthogKey
  ? new PostHog(posthogKey, {
      flushAt: 1,
      flushInterval: 0,
      host: posthogHost,
    })
  : null;

/**
 * Captures an analytics event from a server component, server action, or route handler.
 * Uses Next.js `after()` to flush the event after the response is sent.
 *
 * @param distinctId - The user's unique ID (user UUID).
 * @param event - The event name (e.g. "contact_created").
 * @param properties - Optional event properties. Do not include PII like names or emails.
 */
export function captureServerEvent(
  distinctId: string,
  event: string,
  properties?: Record<string, unknown>,
) {
  if (!posthogClient) {
    return;
  }

  posthogClient.capture({ distinctId, event, properties });

  after(async () => {
    await posthogClient.flush();
  });
}
