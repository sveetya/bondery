import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { MIN_EXTENSION_VERSION } from "@bondery/helpers";
import { loadTestEnv } from "./load-test-env.js";

describe("GET /extension/manifest", () => {
  it("returns extension minVersion without auth", async () => {
    loadTestEnv();

    const { createTestApp } = await import("./create-test-app.js");
    const app = await createTestApp();
    const response = await app.inject({ method: "GET", url: "/extension/manifest" });
    assert.equal(response.statusCode, 200);
    const body = response.json();
    assert.equal(body.extension.minVersion, MIN_EXTENSION_VERSION);
    assert.equal(typeof body.extension.storeUrl, "string");
    await app.close();
  });
});
