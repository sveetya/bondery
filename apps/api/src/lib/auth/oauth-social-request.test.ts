import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  BETTER_AUTH_LINK_SOCIAL_PATH,
  BETTER_AUTH_SIGN_IN_SOCIAL_PATH,
  isSocialOAuthMutationPath,
  resolveUnconfiguredSocialOAuthProvider,
} from "./oauth-social-request.js";

const allOff = { email: true, github: false, linkedin: false };
const allOn = { email: true, github: true, linkedin: true };

describe("isSocialOAuthMutationPath", () => {
  it("matches Better Auth sign-in and link POSTs", () => {
    assert.equal(isSocialOAuthMutationPath(BETTER_AUTH_SIGN_IN_SOCIAL_PATH), true);
    assert.equal(isSocialOAuthMutationPath(`${BETTER_AUTH_LINK_SOCIAL_PATH}?foo=1`), true);
    assert.equal(isSocialOAuthMutationPath(`${BETTER_AUTH_SIGN_IN_SOCIAL_PATH}/`), true);
    assert.equal(isSocialOAuthMutationPath("/auth/callback/github"), false);
    assert.equal(isSocialOAuthMutationPath("/auth/sign-in/passkey"), false);
  });
});

describe("resolveUnconfiguredSocialOAuthProvider", () => {
  it("rejects sign-in and link when the snapshot is false", () => {
    assert.equal(
      resolveUnconfiguredSocialOAuthProvider(
        "POST",
        BETTER_AUTH_SIGN_IN_SOCIAL_PATH,
        { provider: "github" },
        allOff,
      ),
      "github",
    );
    assert.equal(
      resolveUnconfiguredSocialOAuthProvider(
        "POST",
        BETTER_AUTH_LINK_SOCIAL_PATH,
        { provider: "linkedin" },
        allOff,
      ),
      "linkedin",
    );
  });

  it("does not reject configured providers, GET, or other auth paths", () => {
    assert.equal(
      resolveUnconfiguredSocialOAuthProvider(
        "POST",
        BETTER_AUTH_SIGN_IN_SOCIAL_PATH,
        { provider: "github" },
        allOn,
      ),
      null,
    );
    assert.equal(
      resolveUnconfiguredSocialOAuthProvider(
        "GET",
        BETTER_AUTH_SIGN_IN_SOCIAL_PATH,
        { provider: "github" },
        allOff,
      ),
      null,
    );
    assert.equal(
      resolveUnconfiguredSocialOAuthProvider(
        "POST",
        "/auth/callback/github",
        { provider: "github" },
        allOff,
      ),
      null,
    );
  });
});
