import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { resolveSignupMethodFromProviderId } from "../lib/auth/resolve-signup-method.js";

describe("resolveSignupMethodFromProviderId", () => {
  it("maps Better Auth social provider ids", () => {
    assert.equal(resolveSignupMethodFromProviderId("github"), "github");
    assert.equal(resolveSignupMethodFromProviderId("linkedin"), "linkedin");
  });

  it("maps the GoTrue LinkedIn slug to linkedin", () => {
    assert.equal(resolveSignupMethodFromProviderId("linkedin_oidc"), "linkedin");
  });

  it("maps credential to email and unknown providers to unknown", () => {
    assert.equal(resolveSignupMethodFromProviderId("credential"), "email");
    assert.equal(resolveSignupMethodFromProviderId("google"), "unknown");
  });
});
