import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readWebAuthnCredentialId } from "./touch-passkey-last-used.js";

describe("readWebAuthnCredentialId", () => {
  it("reads id from a WebAuthn authentication response", () => {
    assert.equal(readWebAuthnCredentialId({ id: "cred-1", type: "public-key" }), "cred-1");
  });

  it("ignores missing or blank ids", () => {
    assert.equal(readWebAuthnCredentialId(undefined), undefined);
    assert.equal(readWebAuthnCredentialId({}), undefined);
    assert.equal(readWebAuthnCredentialId({ id: "  " }), undefined);
  });
});
