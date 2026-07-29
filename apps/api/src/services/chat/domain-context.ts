import { DomainError } from "../../domains/_shared/context.js";

export function formatToolDomainError(error: unknown, fallback: string): { error: string } {
  if (error instanceof DomainError) {
    return { error: error.message };
  }
  if (error instanceof Error) {
    return { error: error.message };
  }
  return { error: fallback };
}
