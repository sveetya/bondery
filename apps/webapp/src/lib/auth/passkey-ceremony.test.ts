import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { classifyPasskeyCeremonyError, getPasskeyLoginCopyKey } from "./passkey-ceremony.js";

describe("classifyPasskeyCeremonyError", () => {
  it("treats plugin cancel codes as cancel", () => {
    assert.equal(classifyPasskeyCeremonyError({ code: "AUTH_CANCELLED" }), "cancel");
    assert.equal(classifyPasskeyCeremonyError({ code: "REGISTRATION_CANCELLED" }), "cancel");
    assert.equal(classifyPasskeyCeremonyError({ code: "ERROR_CEREMONY_ABORTED" }), "cancel");
  });

  it("treats a clear timeout as timeout, not cancel", () => {
    assert.equal(classifyPasskeyCeremonyError({ code: "TimeoutError" }), "timeout");
    assert.equal(
      classifyPasskeyCeremonyError({ code: "AUTH_CANCELLED", message: "The request timed out." }),
      "timeout",
    );
  });

  it("does not treat Chrome's ambiguous NotAllowed message as timeout", () => {
    assert.equal(
      classifyPasskeyCeremonyError({
        code: "NotAllowedError",
        message: "The operation either timed out or was not allowed.",
      }),
      "cancel",
    );
  });

  it("maps missing credentials and stale sessions", () => {
    assert.equal(classifyPasskeyCeremonyError({ code: "PASSKEY_NOT_FOUND" }), "not_found");
    assert.equal(classifyPasskeyCeremonyError({ code: "SESSION_NOT_FRESH" }), "session_stale");
  });

  it("falls back to fail", () => {
    assert.equal(classifyPasskeyCeremonyError({ code: "AUTHENTICATION_FAILED" }), "fail");
    assert.equal(classifyPasskeyCeremonyError(new Error("boom")), "fail");
  });

  it("maps login copy keys and stays silent on cancel", () => {
    assert.equal(getPasskeyLoginCopyKey("cancel"), null);
    assert.equal(getPasskeyLoginCopyKey("timeout"), "PasskeyTimedOut");
    assert.equal(getPasskeyLoginCopyKey("not_found"), "NoPasskeyFound");
    assert.equal(getPasskeyLoginCopyKey("fail"), "PasskeySignInFailed");
  });
});
