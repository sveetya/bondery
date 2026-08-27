import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { deriveUserHealthStatus } from "./health.js";

describe("deriveUserHealthStatus", () => {
  it("treats rate limits as checking, not offline", () => {
    const status = deriveUserHealthStatus(false, {
      reachable: true,
      report: null,
      status: 429,
    });

    assert.equal(status, "checking");
  });

  it("treats unreachable hops as offline", () => {
    const status = deriveUserHealthStatus(false, {
      reachable: false,
      status: null,
    });

    assert.equal(status, "offline");
  });

  it("treats ready ok responses as online", () => {
    const status = deriveUserHealthStatus(false, {
      reachable: true,
      report: {
        cached: false,
        cacheExpiresAt: new Date().toISOString(),
        status: "ok",
        timestamp: new Date().toISOString(),
      },
      status: 200,
    });

    assert.equal(status, "online");
  });
});
