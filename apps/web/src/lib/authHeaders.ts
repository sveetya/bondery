import { cookies } from "next/headers";

/**
 * Creates headers object with authentication cookies for internal API calls.
 * Use this instead of headers() when making fetch requests to avoid
 * "Headers cannot be modified" errors in production.
 *
 * @returns Headers object with Cookie header containing all cookies
 *
 * @example
 * ```typescript
 * const headers = await getAuthHeaders();
 * const response = await fetch('/api/settings', {
 *   headers,
 *   cache: 'no-store',
 * });
 * ```
 */
export async function getAuthHeaders(): Promise<HeadersInit> {
  const cookieStore = await cookies();

  const cookieHeader = cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");

  return {
    Cookie: cookieHeader,
  };
}
