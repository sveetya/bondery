import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildOpsUploadPayload,
  formatEnvPayload,
  mergeOpsEnv,
  quoteEnvValue,
  readDokployConfig,
} from "./sync-infisical-to-dokploy.mjs";

describe("sync-infisical-to-dokploy", () => {
  const baseEnv = {
    BONDERY_INFRA_PLAUSIBLE_DOMAIN: "plausible.usebondery.com",
    BONDERY_INFRA_WEBAPP_DOMAIN: "app.usebondery.com",
    BONDERY_INFRA_WEBSITE_DOMAIN: "usebondery.com",
    BONDERY_OPS_DOKPLOY_API_KEY: "test-api-key",
    BONDERY_OPS_DOKPLOY_HOST: "https://dokploy.example.com",
    BONDERY_OPS_DOKPLOY_OPS_COMPOSE_ID: "compose-uuid-123",
  };

  it("excludes Dokploy config keys from upload payload", () => {
    const env = {
      ...baseEnv,
      BONDERY_OPS_DOKPLOY_OPS_DEPLOY_WEBHOOK: "https://dokploy.example.com/hook",
    };

    const { uploadKeys } = buildOpsUploadPayload(env);

    assert.deepEqual(uploadKeys, [
      "BONDERY_INFRA_PLAUSIBLE_DOMAIN",
      "BONDERY_INFRA_WEBAPP_DOMAIN",
      "BONDERY_INFRA_WEBSITE_DOMAIN",
    ]);
    assert.equal(uploadKeys.includes("BONDERY_OPS_DOKPLOY_API_KEY"), false);
    assert.equal(uploadKeys.includes("BONDERY_OPS_DOKPLOY_HOST"), false);
    assert.equal(uploadKeys.includes("BONDERY_OPS_DOKPLOY_OPS_COMPOSE_ID"), false);
    assert.equal(uploadKeys.includes("BONDERY_OPS_DOKPLOY_OPS_DEPLOY_WEBHOOK"), false);
  });

  it("fails when required production domain keys are missing", () => {
    const env = { ...baseEnv };
    delete env.BONDERY_INFRA_WEBAPP_DOMAIN;

    let exited = false;
    const originalExit = process.exit;
    process.exit = (code) => {
      exited = true;
      assert.equal(code, 1);
      throw new Error("exit");
    };

    try {
      buildOpsUploadPayload(env);
      assert.fail("expected process.exit(1)");
    } catch {
      // expected from mocked process.exit
    }

    process.exit = originalExit;
    assert.equal(exited, true);
  });

  it("readDokployConfig fails when API key is missing", () => {
    const env = { ...baseEnv };
    delete env.BONDERY_OPS_DOKPLOY_API_KEY;

    let exited = false;
    const originalExit = process.exit;
    process.exit = (code) => {
      exited = true;
      assert.equal(code, 1);
      throw new Error("exit");
    };

    try {
      readDokployConfig(env);
    } catch {
      // expected
    }

    process.exit = originalExit;
    assert.equal(exited, true);
  });

  it("mergeOpsEnv preserves unsynced keys", () => {
    const existing = "BONDERY_INFRA_VERSION=1.8.2\nBONDERY_INFRA_WEBAPP_DOMAIN=old.example.com";
    const rows = [{ key: "BONDERY_INFRA_WEBAPP_DOMAIN", value: "app.usebondery.com" }];

    const merged = mergeOpsEnv(existing, rows, quoteEnvValue);

    assert.match(merged, /BONDERY_INFRA_VERSION=1\.8\.2/);
    assert.match(merged, /BONDERY_INFRA_WEBAPP_DOMAIN=app\.usebondery\.com/);
  });

  it("formatEnvPayload quotes values with special characters", () => {
    const payload = formatEnvPayload(
      [{ key: "BONDERY_INFRA_GIT_SHA", value: "abc def" }],
      quoteEnvValue,
    );

    assert.equal(payload, "BONDERY_INFRA_GIT_SHA=\"abc def\"");
  });
});
