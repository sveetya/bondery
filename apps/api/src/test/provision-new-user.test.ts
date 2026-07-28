import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { resolveDefaultLocale } from "../lib/auth/provision-new-user.js";

describe("resolveDefaultLocale", () => {
  it("defaults to en", () => {
    assert.equal(resolveDefaultLocale(new Headers()), "en");
  });

  it("detects cs from Accept-Language", () => {
    assert.equal(resolveDefaultLocale(new Headers({ "accept-language": "cs-CZ" })), "cs");
  });

  it("detects de from Accept-Language", () => {
    assert.equal(resolveDefaultLocale(new Headers({ "accept-language": "de-DE" })), "de");
  });
});
