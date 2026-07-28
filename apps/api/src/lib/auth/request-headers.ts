import type { FastifyRequest } from "fastify";

export function toFetchHeaders(request: FastifyRequest): Headers {
  const headers = new Headers();
  for (const [key, value] of Object.entries(request.headers)) {
    if (typeof value === "string") {
      headers.append(key, value);
    } else if (Array.isArray(value)) {
      for (const entry of value) {
        headers.append(key, entry);
      }
    }
  }
  return headers;
}
