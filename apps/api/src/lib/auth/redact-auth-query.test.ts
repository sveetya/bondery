import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isMagicLinkVerifyPath, redactSensitiveAuthQuery } from "./redact-auth-query.js";

describe("redactSensitiveAuthQuery", () => {
  it("redacts token query values on relative verify URLs", () => {
    assert.equal(
      redactSensitiveAuthQuery(
        "/auth/magic-link/verify?token=secret-value&callbackURL=/auth/start",
      ),
      "/auth/magic-link/verify?token=REDACTED&callbackURL=/auth/start",
    );
  });

  it("leaves URLs without a token query unchanged", () => {
    assert.equal(redactSensitiveAuthQuery("/auth/sign-in/magic-link"), "/auth/sign-in/magic-link");
  });
});

describe("isMagicLinkVerifyPath", () => {
  it("matches the Better Auth verify path with a query string", () => {
    assert.equal(isMagicLinkVerifyPath("/auth/magic-link/verify?token=abc"), true);
    assert.equal(isMagicLinkVerifyPath("/auth/sign-in/magic-link"), false);
  });
});
