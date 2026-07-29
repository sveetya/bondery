import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { adminAc } from "better-auth/plugins/admin/access";
import { platformAdminRole } from "../lib/auth/platform-admin-access.js";

describe("platformAdminRole", () => {
  it("omits impersonate permissions", () => {
    const permissions = platformAdminRole.statements.user;
    assert.equal(permissions.includes("impersonate"), false);
    assert.equal(permissions.includes("impersonate-admins"), false);
    assert.ok(permissions.length > 0);
    assert.ok(adminAc.statements.user.includes("impersonate"));
  });
});
