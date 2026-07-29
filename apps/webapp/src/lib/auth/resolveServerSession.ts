import { cache } from "react";
import {
  fetchBetterAuthAccessToken,
  fetchBetterAuthSession,
  signOutBetterAuthSession,
  type BetterAuthUser,
} from "@/lib/auth/server";

export type ServerSessionResult =
  | { status: "ok"; user: BetterAuthUser; accessToken: string }
  | { status: "unauthorized" };

/**
 * Single server-side session primitive for auth guards and API transport.
 *
 * Reads the webapp's encrypted OAuth-BFF session cookie — independent of
 * Better Auth's native API-domain cookie used for social sign-in/consent.
 */
export const resolveServerSession = cache(async (): Promise<ServerSessionResult> => {
  const session = await fetchBetterAuthSession();
  const accessToken = await fetchBetterAuthAccessToken(undefined, session);

  if (!session || !accessToken) {
    return { status: "unauthorized" };
  }

  return {
    accessToken,
    status: "ok",
    user: session.user,
  };
});

/** Clears the webapp BFF session cookie on the server. */
export async function signOutServerSession(): Promise<void> {
  await signOutBetterAuthSession();
}

/** Clears the BFF session cookie when a stale encrypted payload fails decryption. */
export async function signOutStaleServerSession(): Promise<void> {
  const session = await fetchBetterAuthSession();
  if (!session) {
    return;
  }

  await signOutBetterAuthSession();
}
