import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { resolveProvisionLocaleFromContext } from "../lib/auth/resolve-provision-locale.js";

describe("resolveProvisionLocaleFromContext", () => {
  it("defaults to en when context is missing", () => {
    assert.equal(resolveProvisionLocaleFromContext(undefined), "en");
  });

  it("detects cs from Accept-Language on context headers", () => {
    assert.equal(
      resolveProvisionLocaleFromContext({
        headers: new Headers({ "accept-language": "cs-CZ" }),
      } as never),
      "cs",
    );
  });

  it("detects de from Accept-Language on request headers", () => {
    assert.equal(
      resolveProvisionLocaleFromContext({
        request: { headers: new Headers({ "accept-language": "de-DE" }) },
      } as never),
      "de",
    );
  });
});
