import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { WEBAPP_RUNTIME_ENV } from "../platform/runtimeConfig.env.js";
import {
  normalizeApiBaseUrl,
  preferIpv4LoopbackForServerFetch,
  resolvePublicApiBaseUrl,
  resolveServerApiBaseUrl,
} from "./resolveServerApiUrl.js";

describe("normalizeApiBaseUrl", () => {
  it("leaves localhost unchanged for public OAuth identifiers", () => {
    assert.equal(normalizeApiBaseUrl("http://localhost:26631"), "http://localhost:26631");
  });
});

describe("preferIpv4LoopbackForServerFetch", () => {
  it("pins localhost to 127.0.0.1 for server-side fetches", () => {
    assert.equal(
      preferIpv4LoopbackForServerFetch("http://localhost:26631"),
      "http://127.0.0.1:26631",
    );
  });
});

describe("resolveServerApiBaseUrl", () => {
  it("pins localhost when falling back to the public URL", () => {
    const base = resolveServerApiBaseUrl({
      [WEBAPP_RUNTIME_ENV.apiUrl]: "http://localhost:26631",
    });
    assert.equal(base, "http://127.0.0.1:26631");
  });
});

describe("resolvePublicApiBaseUrl", () => {
  it("keeps localhost for OAuth resource and issuer identifiers", () => {
    const base = resolvePublicApiBaseUrl({
      [WEBAPP_RUNTIME_ENV.apiUrl]: "http://localhost:26631/",
    });
    assert.equal(base, "http://localhost:26631");
  });
});
