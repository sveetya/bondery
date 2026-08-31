import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  areAllOAuthProvidersDisabled,
  isOAuthProviderEnabled,
  parseOAuthProvidersResponse,
} from "./oauth-providers.js";

describe("parseOAuthProvidersResponse", () => {
  it("returns the bitmap for a closed resource-keyed payload", () => {
    assert.deepEqual(
      parseOAuthProvidersResponse({ oauthProviders: { github: true, linkedin: false } }),
      { github: true, linkedin: false },
    );
  });

  it("returns null for missing, extra, or malformed payloads", () => {
    assert.equal(parseOAuthProvidersResponse(null), null);
    assert.equal(parseOAuthProvidersResponse({ github: true }), null);
    assert.equal(
      parseOAuthProvidersResponse({
        oauthProviders: { extra: true, github: true, linkedin: false },
      }),
      null,
    );
  });
});

describe("isOAuthProviderEnabled", () => {
  it("fail-opens when the snapshot is missing", () => {
    assert.equal(isOAuthProviderEnabled(null, "github"), true);
    assert.equal(isOAuthProviderEnabled(undefined, "linkedin"), true);
  });

  it("disables only an explicit false", () => {
    assert.equal(isOAuthProviderEnabled({ github: false, linkedin: true }, "github"), false);
    assert.equal(isOAuthProviderEnabled({ github: false, linkedin: true }, "linkedin"), true);
    assert.equal(isOAuthProviderEnabled({ github: true, linkedin: true }, "github"), true);
  });
});

describe("areAllOAuthProvidersDisabled", () => {
  it("is true only when both providers are explicitly false", () => {
    assert.equal(areAllOAuthProvidersDisabled(null), false);
    assert.equal(areAllOAuthProvidersDisabled({ github: false, linkedin: true }), false);
    assert.equal(areAllOAuthProvidersDisabled({ github: false, linkedin: false }), true);
  });
});
