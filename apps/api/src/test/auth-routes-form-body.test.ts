import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { loadTestEnv } from "./load-test-env.js";

loadTestEnv();

const { createTestApp } = await import("./create-test-app.js");

describe("auth routes form body bridge", () => {
  it("parses application/x-www-form-urlencoded on /auth/oauth2/token", async () => {
    const app = await createTestApp();
    try {
      const response = await app.inject({
        headers: { "content-type": "application/x-www-form-urlencoded" },
        method: "POST",
        payload: new URLSearchParams({
          client_id: "test-webapp-client-id",
          code: "fake-code",
          grant_type: "authorization_code",
        }).toString(),
        url: "/auth/oauth2/token",
      });

      assert.notEqual(
        response.body,
        JSON.stringify({
          error: "invalid_request",
          error_description: "grant_type is required",
        }),
        "form body must reach Better Auth (grant_type should be parsed)",
      );
      assert.notEqual(response.statusCode, 415, "must not reject form-urlencoded bodies");
    } finally {
      await app.close();
    }
  });
});
