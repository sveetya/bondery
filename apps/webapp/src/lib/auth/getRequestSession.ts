import "server-only";

import { cache } from "react";
import { probeMeSessionWithAccessToken } from "@/lib/api/domains/server/meSession";
import type { MeSessionData } from "@/lib/api/resources/meSession";
import {
  type BetterAuthUser,
  fetchBetterAuthAccessToken,
  fetchBetterAuthSession,
} from "@/lib/auth/server";

export type RequestSession =
  | { kind: "anonymous" }
  | {
      accessToken: string;
      api: "ok" | "unavailable";
      kind: "authenticated";
      shell: MeSessionData | null;
      user: BetterAuthUser;
    };

/**
 * Single server-side session primitive for layouts, BFF, and transport.
 *
 * Identity comes from Better Auth. `/me/session` is a derived shell read model.
 * Layouts use this for auth gates only — hop failures stay on the current URL.
 */
export const getRequestSession = cache(async (): Promise<RequestSession> => {
  const auth = await fetchBetterAuthSession();
  if (!auth) {
    return { kind: "anonymous" };
  }

  const accessToken = await fetchBetterAuthAccessToken(undefined, auth);
  if (!accessToken) {
    return { kind: "anonymous" };
  }

  const probe = await probeMeSessionWithAccessToken(accessToken);

  if (probe.status === "ok") {
    return {
      accessToken,
      api: "ok",
      kind: "authenticated",
      shell: probe.session,
      user: auth.user,
    };
  }

  if (probe.status === "unauthorized") {
    return { kind: "anonymous" };
  }

  return {
    accessToken,
    api: "unavailable",
    kind: "authenticated",
    shell: null,
    user: auth.user,
  };
});
