import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { hasPremiumAccess } from "../services/billing/entitlements.js";
import { mapStripeStatus } from "../services/billing/map-status.js";
import { isScheduledToCancel } from "../services/billing/stripe-helpers.js";

describe("mapStripeStatus", () => {
  it("maps trialing to active", () => {
    assert.equal(mapStripeStatus("trialing", false), "active");
  });

  it("maps trialing with cancel_at_period_end to canceling", () => {
    assert.equal(mapStripeStatus("trialing", true), "canceling");
  });

  it("maps active with cancel_at_period_end to canceling", () => {
    assert.equal(mapStripeStatus("active", true), "canceling");
  });

  it("maps active without cancel_at_period_end to active", () => {
    assert.equal(mapStripeStatus("active", false), "active");
  });

  it("maps past_due to past_due", () => {
    assert.equal(mapStripeStatus("past_due", false), "past_due");
  });

  it("maps canceled to canceled", () => {
    assert.equal(mapStripeStatus("canceled", false), "canceled");
  });
});

describe("isScheduledToCancel", () => {
  it("is true when cancel_at_period_end is set (classic billing)", () => {
    assert.equal(isScheduledToCancel({ cancel_at: null, cancel_at_period_end: true }), true);
  });

  it("is true when cancel_at is set (flexible portal cancel)", () => {
    assert.equal(
      isScheduledToCancel({ cancel_at: 1_778_025_600, cancel_at_period_end: false }),
      true,
    );
  });

  it("is false when neither cancel flag is set", () => {
    assert.equal(isScheduledToCancel({ cancel_at: null, cancel_at_period_end: false }), false);
  });
});

describe("hasPremiumAccess", () => {
  it("returns false when subscription is null", () => {
    assert.equal(hasPremiumAccess(null), false);
  });

  it("returns true for active and canceling", () => {
    assert.equal(hasPremiumAccess({ paymentFailureCount: 0, status: "active" }), true);
    assert.equal(hasPremiumAccess({ paymentFailureCount: 0, status: "canceling" }), true);
  });

  it("returns true for past_due with fewer than three failures", () => {
    assert.equal(hasPremiumAccess({ paymentFailureCount: 2, status: "past_due" }), true);
  });

  it("returns false for past_due with three or more failures", () => {
    assert.equal(hasPremiumAccess({ paymentFailureCount: 3, status: "past_due" }), false);
  });

  it("returns false for canceled", () => {
    assert.equal(hasPremiumAccess({ paymentFailureCount: 0, status: "canceled" }), false);
  });
});
