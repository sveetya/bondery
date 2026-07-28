import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  parseBetterAuthSecretsString,
  resolveBetterAuthSecrets,
} from "../lib/auth/resolve-secrets.js";

describe("resolveBetterAuthSecrets", () => {
  it("parses a single versioned secret", () => {
    const secrets = parseBetterAuthSecretsString(
      "1:abcdefghijklmnopqrstuvwxyz0123456789abcd",
    );
    assert.equal(secrets.length, 1);
    assert.equal(secrets[0]?.version, 1);
    assert.equal(secrets[0]?.value, "abcdefghijklmnopqrstuvwxyz0123456789abcd");
  });

  it("parses rotation secrets with highest version first", () => {
    const secrets = parseBetterAuthSecretsString(
      "2:new-secret-value-that-is-long-enough-ok,1:old-secret-value-that-is-long-enough-ok",
    );
    assert.equal(secrets[0]?.version, 2);
    assert.equal(secrets[1]?.version, 1);
  });

  it("rejects secrets shorter than 32 characters", () => {
    assert.throws(() => parseBetterAuthSecretsString("1:short"));
  });

  it("rejects when highest version is not listed first", () => {
    assert.throws(() =>
      parseBetterAuthSecretsString(
        "1:old-secret-value-that-is-long-enough-ok,2:new-secret-value-that-is-long-enough-ok",
      ),
    );
  });

  it("reads BONDERY_PRIVATE_BETTER_AUTH_SECRETS from env", () => {
    const secrets = resolveBetterAuthSecrets({
      BONDERY_PRIVATE_BETTER_AUTH_SECRETS:
        "1:abcdefghijklmnopqrstuvwxyz0123456789abcd",
    });
    assert.equal(secrets[0]?.version, 1);
  });
});
