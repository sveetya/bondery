import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ApiError } from "@bondery/helpers/api";
import {
  applyTransportErrorPolicy,
  applyTransportResponsePolicy,
} from "./applyTransportErrorPolicy.js";

describe("applyTransportErrorPolicy", () => {
  it("does not throw on hop-down errors and does not require a banner store", () => {
    assert.doesNotThrow(() => applyTransportErrorPolicy(new TypeError("Failed to fetch")));
    assert.doesNotThrow(() =>
      applyTransportErrorPolicy(
        new ApiError({
          code: "service_unavailable",
          developerMessage: "unavailable",
          status: 503,
        }),
      ),
    );
  });
});

describe("applyTransportResponsePolicy", () => {
  it("does not throw on hop-down statuses", () => {
    assert.doesNotThrow(() => applyTransportResponsePolicy(new Response(null, { status: 503 })));
    assert.doesNotThrow(() => applyTransportResponsePolicy(new Response(null, { status: 502 })));
  });
});
