import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveCookieDomain } from "./resolve-cookie-domain.js";

describe("resolveCookieDomain", () => {
  it("returns parent domain for app subdomain", () => {
    assert.equal(resolveCookieDomain("https://app.usebondery.com"), "usebondery.com");
  });

  it("returns apex domain when hostname has two labels", () => {
    assert.equal(resolveCookieDomain("https://usebondery.com"), "usebondery.com");
  });

  it("returns undefined for localhost", () => {
    assert.equal(resolveCookieDomain("http://localhost:26632"), undefined);
  });

  it("returns undefined for IP hosts", () => {
    assert.equal(resolveCookieDomain("http://127.0.0.1:26632"), undefined);
  });

  it("returns undefined for empty input", () => {
    assert.equal(resolveCookieDomain(""), undefined);
    assert.equal(resolveCookieDomain(undefined), undefined);
  });
});
