export function classifyProbeError(error: unknown): string {
  if (error instanceof Error) {
    if (error.name === "AbortError") {
      return "timeout";
    }
    if (error.message.includes("fetch failed")) {
      return "unreachable";
    }
    return error.message;
  }
  return "unknown";
}
