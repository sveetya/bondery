import { webappRuntimeConfigSchema } from "@bondery/schemas";
import posthog from "posthog-js";

import { isBrowserDntEnabled, syncBrowserDntState } from "./src/lib/analytics/preference";

if (typeof window !== "undefined") {
  syncBrowserDntState();

  const parsed = webappRuntimeConfigSchema.safeParse(window.__BONDERY_RUNTIME_CONFIG__);
  if (parsed.success && parsed.data.posthogKey) {
    posthog.init(parsed.data.posthogKey, {
      api_host: parsed.data.posthogHost ?? "https://eu.i.posthog.com",
      defaults: "2025-11-30",
    });

    if (isBrowserDntEnabled()) {
      posthog.opt_out_capturing();
    }
  }
}
