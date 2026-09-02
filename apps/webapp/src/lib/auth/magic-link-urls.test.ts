import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildLoginMagicLinkUrls,
  buildOAuthLoginMagicLinkUrls,
  searchWithoutTransientAuthErrors,
} from "./magic-link-urls.js";

const ORIGIN = "https://app.usebondery.com";

describe("buildLoginMagicLinkUrls", () => {
  it("sends webapp login to /auth/start and errors back to /login", () => {
    const urls = buildLoginMagicLinkUrls(ORIGIN, null);
    assert.equal(urls.callbackURL, `${ORIGIN}/auth/start`);
    assert.equal(urls.errorCallbackURL, `${ORIGIN}/login`);
  });

  it("forwards a return intent on the start URL, not the error URL", () => {
    const urls = buildLoginMagicLinkUrls(ORIGIN, "/app/home");
    assert.equal(
      urls.callbackURL,
      `${ORIGIN}/auth/start?redirect=${encodeURIComponent("/app/home")}`,
    );
    assert.equal(urls.errorCallbackURL, `${ORIGIN}/login`);
  });

  it("keeps a consent return as an absolute consent URL", () => {
    const urls = buildLoginMagicLinkUrls(ORIGIN, "/oauth/consent?client_id=abc");
    assert.equal(urls.callbackURL, `${ORIGIN}/oauth/consent?client_id=abc`);
    assert.equal(urls.errorCallbackURL, `${ORIGIN}/login`);
  });
});

describe("buildOAuthLoginMagicLinkUrls", () => {
  it("never uses /auth/start and preserves the current search on consent and error", () => {
    const urls = buildOAuthLoginMagicLinkUrls(ORIGIN, "?client_id=abc&state=1");
    assert.equal(urls.callbackURL, `${ORIGIN}/oauth/consent?client_id=abc&state=1`);
    assert.equal(urls.errorCallbackURL, `${ORIGIN}/oauth/login?client_id=abc&state=1`);
    assert.doesNotMatch(urls.callbackURL, /\/auth\/start/);
  });

  it("strips verify error params so they are not copied onto consent", () => {
    const urls = buildOAuthLoginMagicLinkUrls(
      ORIGIN,
      "?client_id=abc&error=INVALID_TOKEN&error_description=expired&state=1",
    );
    assert.equal(urls.callbackURL, `${ORIGIN}/oauth/consent?client_id=abc&state=1`);
    assert.equal(urls.errorCallbackURL, `${ORIGIN}/oauth/login?client_id=abc&state=1`);
  });
});

describe("searchWithoutTransientAuthErrors", () => {
  it("returns an empty string when only error params remain", () => {
    assert.equal(searchWithoutTransientAuthErrors("?error=INVALID_TOKEN"), "");
  });
});
