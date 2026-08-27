import "server-only";

import { cookies } from "next/headers";
import { LAST_USED_LOGIN_METHOD_COOKIE } from "@/lib/auth/constants";

export async function getLastUsedLoginMethodCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(LAST_USED_LOGIN_METHOD_COOKIE)?.value ?? null;
}
