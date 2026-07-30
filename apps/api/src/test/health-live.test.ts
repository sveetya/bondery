import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { loadTestEnv } from "./load-test-env.js";

describe("GET /health/live", () => {
  it("returns 200 without auth", async () => {
    loadTestEnv();

    const { createTestApp } = await import("./create-test-app.js");
    const app = await createTestApp();
    const response = await app.inject({ method: "GET", url: "/health/live" });
    assert.equal(response.statusCode, 200);
    const body = response.json();
    assert.equal(body.status, "ok");
    assert.equal(body.extension, undefined);
    await app.close();
  });
});
