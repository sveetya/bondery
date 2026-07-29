import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { keepInTouchCountResponseSchema } from "@bondery/schemas";

import { loadTestEnv } from "./load-test-env.js";

loadTestEnv();

describe("keepInTouchCountResponseSchema", () => {
  it("parses overdueCount", () => {
    const parsed = keepInTouchCountResponseSchema.parse({ overdueCount: 3 });
    assert.equal(parsed.overdueCount, 3);
  });

  it("rejects negative overdueCount", () => {
    assert.throws(() => keepInTouchCountResponseSchema.parse({ overdueCount: -1 }));
  });
});

describe("getKeepInTouchOverdueCount", () => {
  it("returns count from rpc", async () => {
    const { getKeepInTouchOverdueCount } = await import("../domains/contacts/keep-in-touch.js");
    const result = await getKeepInTouchOverdueCount({
      db: {
        $queryRaw: async () => [{ count: 5 }],
      } as never,
      log: undefined,
      user: { email: "u@example.com", id: "user-1" },
    });

    assert.deepEqual(result, { overdueCount: 5 });
  });

  it("returns zero when rpc data is empty", async () => {
    const { getKeepInTouchOverdueCount } = await import("../domains/contacts/keep-in-touch.js");
    const result = await getKeepInTouchOverdueCount({
      db: {
        $queryRaw: async () => [],
      } as never,
      log: undefined,
      user: { email: "u@example.com", id: "user-1" },
    });

    assert.deepEqual(result, { overdueCount: 0 });
  });
});
