import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  areAllOAuthProvidersDisabled,
  isEmailSignInEnabled,
  isOAuthProviderEnabled,
  parseOAuthProvidersResponse,
} from "./oauth-providers.js";

describe("parseOAuthProvidersResponse", () => {
  it("returns the bitmap for a closed resource-keyed payload", () => {
    assert.deepEqual(
      parseOAuthProvidersResponse({
        oauthProviders: { email: true, github: true, linkedin: false },
      }),
      { email: true, github: true, linkedin: false },
    );
  });

  it("returns null for missing, extra, or malformed payloads", () => {
    assert.equal(parseOAuthProvidersResponse(null), null);
    assert.equal(parseOAuthProvidersResponse({ github: true }), null);
    assert.equal(
      parseOAuthProvidersResponse({
        oauthProviders: { email: true, extra: true, github: true, linkedin: false },
      }),
      null,
    );
    assert.equal(
      parseOAuthProvidersResponse({
        oauthProviders: { github: true, linkedin: false },
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
    assert.equal(
      isOAuthProviderEnabled({ email: true, github: false, linkedin: true }, "github"),
      false,
    );
    assert.equal(
      isOAuthProviderEnabled({ email: true, github: false, linkedin: true }, "linkedin"),
      true,
    );
    assert.equal(
      isOAuthProviderEnabled({ email: true, github: true, linkedin: true }, "github"),
      true,
    );
  });
});

describe("isEmailSignInEnabled", () => {
  it("fail-opens when the snapshot is missing", () => {
    assert.equal(isEmailSignInEnabled(null), true);
    assert.equal(isEmailSignInEnabled(undefined), true);
  });

  it("disables only an explicit false", () => {
    assert.equal(isEmailSignInEnabled({ email: false, github: true, linkedin: true }), false);
    assert.equal(isEmailSignInEnabled({ email: true, github: false, linkedin: false }), true);
  });
});

describe("areAllOAuthProvidersDisabled", () => {
  it("is true only when both providers are explicitly false", () => {
    assert.equal(areAllOAuthProvidersDisabled(null), false);
    assert.equal(
      areAllOAuthProvidersDisabled({ email: true, github: false, linkedin: true }),
      false,
    );
    assert.equal(
      areAllOAuthProvidersDisabled({ email: true, github: false, linkedin: false }),
      true,
    );
  });
});
