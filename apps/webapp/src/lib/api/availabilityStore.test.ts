import assert from "node:assert/strict";
import { afterEach, describe, it, mock } from "node:test";
import { retryApiConnection } from "./availabilityStore.js";

afterEach(() => {
  mock.restoreAll();
});

describe("retryApiConnection", () => {
  it("classifies HTTP 200 as ok", async () => {
    mock.method(globalThis, "fetch", async () => new Response(null, { status: 200 }));
    assert.equal(await retryApiConnection(), "ok");
  });

  it("classifies HTTP 401 as unauthorized", async () => {
    mock.method(globalThis, "fetch", async () => new Response(null, { status: 401 }));
    assert.equal(await retryApiConnection(), "unauthorized");
  });

  it("classifies HTTP 503 as unavailable", async () => {
    mock.method(globalThis, "fetch", async () => new Response(null, { status: 503 }));
    assert.equal(await retryApiConnection(), "unavailable");
  });

  it("classifies network failure as unavailable", async () => {
    mock.method(globalThis, "fetch", async () => {
      throw new TypeError("Failed to fetch");
    });
    assert.equal(await retryApiConnection(), "unavailable");
  });
});
