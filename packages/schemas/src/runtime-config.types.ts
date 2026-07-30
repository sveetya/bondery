/** Public runtime configuration for the webapp (no secrets). */
export interface WebappRuntimeConfig {
  apiBaseUrl: string;
  gitSha?: string;
  posthogHost?: string;
  posthogKey?: string;
  runtimeConfigVersion: 1;
  stripePublishableKey?: string;
  version?: string;
  webappUrl: string;
  websiteUrl: string;
}
