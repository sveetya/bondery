export type OAuthProviderId = "github" | "linkedin";

export type OAuthProvidersBitmap = {
  email: boolean;
  github: boolean;
  linkedin: boolean;
};

/** Resource-keyed public snapshot of which social IdPs are configured on this API. */
export type OAuthProvidersResponse = {
  oauthProviders: OAuthProvidersBitmap;
};
