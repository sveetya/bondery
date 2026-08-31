import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isLastUsedOAuthProvider,
  isLastUsedPasskey,
  resolveAnalyticsLoginMethod,
} from "./last-login-method.js";

describe("last login method matching", () => {
  it("matches github and linkedin callback ids from lastLoginMethod", () => {
    assert.equal(isLastUsedOAuthProvider("github", "github"), true);
    assert.equal(isLastUsedOAuthProvider("linkedin", "linkedin"), true);
    assert.equal(isLastUsedOAuthProvider("linkedin_oidc", "linkedin"), true);
    assert.equal(isLastUsedOAuthProvider("github", "linkedin"), false);
  });

  it("matches passkey from verify-authentication", () => {
    assert.equal(isLastUsedPasskey("passkey"), true);
    assert.equal(isLastUsedPasskey("github"), false);
  });

  it("maps analytics login_method without PII", () => {
    assert.equal(resolveAnalyticsLoginMethod("passkey"), "passkey");
    assert.equal(resolveAnalyticsLoginMethod("github"), "oauth_github");
    assert.equal(resolveAnalyticsLoginMethod("linkedin"), "oauth_linkedin");
    assert.equal(resolveAnalyticsLoginMethod(null), undefined);
  });
});
