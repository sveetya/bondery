import { permanentRedirect } from "next/navigation";
import { buildWebappRuntimeConfigFromEnv } from "@/lib/platform/runtimeConfig.server";

export function GET() {
  const origin = buildWebappRuntimeConfigFromEnv().websiteUrl.replace(/\/+$/, "");
  permanentRedirect(`${origin}/.well-known/ard.json`);
}
