import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isOAuthAppConfigured,
  isOAuthCredentialPairIncomplete,
  resolveOAuthProviderSnapshot,
} from "./oauth-provider-config.js";

describe("isOAuthAppConfigured", () => {
  it("requires both id and secret after trim", () => {
    assert.equal(isOAuthAppConfigured("id", "secret"), true);
    assert.equal(isOAuthAppConfigured(" id ", " secret "), true);
  });

  it("is false for empty, whitespace, or half-set pairs", () => {
    assert.equal(isOAuthAppConfigured(undefined, undefined), false);
    assert.equal(isOAuthAppConfigured("", "secret"), false);
    assert.equal(isOAuthAppConfigured("id", ""), false);
    assert.equal(isOAuthAppConfigured("  ", "secret"), false);
    assert.equal(isOAuthAppConfigured("id", "   "), false);
    assert.equal(isOAuthAppConfigured("id", undefined), false);
  });
});

describe("isOAuthCredentialPairIncomplete", () => {
  it("is true only when exactly one side is set", () => {
    assert.equal(isOAuthCredentialPairIncomplete("id", undefined), true);
    assert.equal(isOAuthCredentialPairIncomplete("", "secret"), true);
    assert.equal(isOAuthCredentialPairIncomplete("id", "secret"), false);
    assert.equal(isOAuthCredentialPairIncomplete("", ""), false);
  });
});

describe("resolveOAuthProviderSnapshot", () => {
  it("omits unconfigured providers from socialProviders", () => {
    const snapshot = resolveOAuthProviderSnapshot({
      BONDERY_PRIVATE_AUTH_GITHUB_CLIENT_ID: "gh-id",
      BONDERY_PRIVATE_AUTH_GITHUB_CLIENT_SECRET: "gh-secret",
      BONDERY_PRIVATE_AUTH_LINKEDIN_CLIENT_ID: "  ",
      BONDERY_PRIVATE_AUTH_LINKEDIN_CLIENT_SECRET: "li-secret",
    });

    assert.deepEqual(snapshot.oauthProviders, { github: true, linkedin: false });
    assert.deepEqual(snapshot.incomplete, { github: false, linkedin: true });
    assert.deepEqual(snapshot.socialProviders, {
      github: { clientId: "gh-id", clientSecret: "gh-secret" },
    });
    assert.equal("linkedin" in snapshot.socialProviders, false);
  });
});
