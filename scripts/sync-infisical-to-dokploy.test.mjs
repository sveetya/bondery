import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildOpsUploadPayload,
  buildUploadPayload,
  formatEnvPayload,
  mergeComposeEnv,
  mergeOpsEnv,
  quoteEnvValue,
  readDokployConfig,
} from "./sync-infisical-to-dokploy.mjs";

describe("sync-infisical-to-dokploy", () => {
  const websiteEnv = {
    BONDERY_INFRA_PLAUSIBLE_DOMAIN: "plausible.usebondery.com",
    BONDERY_INFRA_WEBAPP_DOMAIN: "app.usebondery.com",
    BONDERY_INFRA_WEBSITE_DOMAIN: "usebondery.com",
    BONDERY_OPS_DOKPLOY_API_KEY: "test-api-key",
    BONDERY_OPS_DOKPLOY_HOST: "https://dokploy.example.com",
    BONDERY_OPS_DOKPLOY_OPS_COMPOSE_ID: "website-compose-id",
  };

  const plausibleEnv = {
    BONDERY_INFRA_PLAUSIBLE_DISABLE_REGISTRATION: "invite_only",
    BONDERY_INFRA_PLAUSIBLE_DOMAIN: "plausible.usebondery.com",
    BONDERY_OPS_DOKPLOY_API_KEY: "test-api-key",
    BONDERY_OPS_DOKPLOY_HOST: "https://dokploy.example.com",
    BONDERY_OPS_DOKPLOY_PLAUSIBLE_COMPOSE_ID: "plausible-compose-id",
    BONDERY_PRIVATE_PLAUSIBLE_POSTGRES_PASSWORD: "postgres-secret",
    BONDERY_PRIVATE_PLAUSIBLE_SECRET_KEY_BASE: "secret-key-base",
    BONDERY_PRIVATE_PLAUSIBLE_TOTP_VAULT_KEY: "totp-vault-key",
  };

  it("website payload excludes Dokploy config keys and plausible secrets", () => {
    const env = {
      ...websiteEnv,
      BONDERY_OPS_DOKPLOY_OPS_DEPLOY_WEBHOOK: "https://dokploy.example.com/hook",
      BONDERY_PRIVATE_PLAUSIBLE_SECRET_KEY_BASE: "should-not-upload",
    };

    const { uploadKeys } = buildUploadPayload(env, "website");

    assert.deepEqual(uploadKeys, [
      "BONDERY_INFRA_PLAUSIBLE_DOMAIN",
      "BONDERY_INFRA_WEBAPP_DOMAIN",
      "BONDERY_INFRA_WEBSITE_DOMAIN",
    ]);
    assert.equal(uploadKeys.includes("BONDERY_OPS_DOKPLOY_API_KEY"), false);
    assert.equal(uploadKeys.includes("BONDERY_PRIVATE_PLAUSIBLE_SECRET_KEY_BASE"), false);
  });

  it("plausible payload includes plausible secrets only", () => {
    const { uploadKeys } = buildUploadPayload(plausibleEnv, "plausible");

    assert.deepEqual(uploadKeys, [
      "BONDERY_INFRA_PLAUSIBLE_DISABLE_REGISTRATION",
      "BONDERY_INFRA_PLAUSIBLE_DOMAIN",
      "BONDERY_PRIVATE_PLAUSIBLE_POSTGRES_PASSWORD",
      "BONDERY_PRIVATE_PLAUSIBLE_SECRET_KEY_BASE",
      "BONDERY_PRIVATE_PLAUSIBLE_TOTP_VAULT_KEY",
    ]);
    assert.equal(uploadKeys.includes("BONDERY_INFRA_WEBAPP_DOMAIN"), false);
    assert.equal(uploadKeys.includes("BONDERY_INFRA_WEBSITE_DOMAIN"), false);
  });

  it("buildOpsUploadPayload remains an alias for website target", () => {
    const { uploadKeys } = buildOpsUploadPayload(websiteEnv);
    assert.deepEqual(uploadKeys, [
      "BONDERY_INFRA_PLAUSIBLE_DOMAIN",
      "BONDERY_INFRA_WEBAPP_DOMAIN",
      "BONDERY_INFRA_WEBSITE_DOMAIN",
    ]);
  });

  for (const missingKey of [
    "BONDERY_INFRA_WEBAPP_DOMAIN",
    "BONDERY_INFRA_WEBSITE_DOMAIN",
    "BONDERY_INFRA_PLAUSIBLE_DOMAIN",
  ]) {
    it(`website sync fails when required key ${missingKey} is missing`, () => {
      const env = { ...websiteEnv };
      delete env[missingKey];

      let exited = false;
      const originalExit = process.exit;
      process.exit = (code) => {
        exited = true;
        assert.equal(code, 1);
        throw new Error("exit");
      };

      try {
        buildUploadPayload(env, "website");
        assert.fail("expected process.exit(1)");
      } catch {
        // expected from mocked process.exit
      }

      process.exit = originalExit;
      assert.equal(exited, true);
    });
  }

  it("plausible sync fails when a required secret is missing", () => {
    const env = { ...plausibleEnv };
    delete env.BONDERY_PRIVATE_PLAUSIBLE_SECRET_KEY_BASE;

    let exited = false;
    const originalExit = process.exit;
    process.exit = (code) => {
      exited = true;
      assert.equal(code, 1);
      throw new Error("exit");
    };

    try {
      buildUploadPayload(env, "plausible");
      assert.fail("expected process.exit(1)");
    } catch {
      // expected
    }

    process.exit = originalExit;
    assert.equal(exited, true);
  });

  it("readDokployConfig resolves website compose id", () => {
    const config = readDokployConfig(websiteEnv, "website");
    assert.equal(config.composeId, "website-compose-id");
    assert.equal(config.target, "website");
  });

  it("readDokployConfig resolves plausible compose id", () => {
    const config = readDokployConfig(plausibleEnv, "plausible");
    assert.equal(config.composeId, "plausible-compose-id");
    assert.equal(config.webhookKey, "BONDERY_OPS_DOKPLOY_PLAUSIBLE_DEPLOY_WEBHOOK");
  });

  it("readDokployConfig fails when API key is missing", () => {
    const env = { ...websiteEnv };
    delete env.BONDERY_OPS_DOKPLOY_API_KEY;

    let exited = false;
    const originalExit = process.exit;
    process.exit = (code) => {
      exited = true;
      assert.equal(code, 1);
      throw new Error("exit");
    };

    try {
      readDokployConfig(env, "website");
    } catch {
      // expected
    }

    process.exit = originalExit;
    assert.equal(exited, true);
  });

  it("mergeComposeEnv preserves unsynced keys", () => {
    const existing = "BONDERY_INFRA_VERSION=1.8.2\nBONDERY_INFRA_WEBAPP_DOMAIN=old.example.com";
    const rows = [{ key: "BONDERY_INFRA_WEBAPP_DOMAIN", value: "app.usebondery.com" }];

    const merged = mergeComposeEnv(existing, rows, quoteEnvValue);

    assert.match(merged, /BONDERY_INFRA_VERSION=1\.8\.2/);
    assert.match(merged, /BONDERY_INFRA_WEBAPP_DOMAIN=app\.usebondery\.com/);
  });

  it("mergeOpsEnv remains an alias for mergeComposeEnv", () => {
    const existing = "BONDERY_INFRA_VERSION=1.8.2";
    const rows = [{ key: "BONDERY_INFRA_WEBAPP_DOMAIN", value: "app.usebondery.com" }];
    assert.equal(
      mergeOpsEnv(existing, rows, quoteEnvValue),
      mergeComposeEnv(existing, rows, quoteEnvValue),
    );
  });

  it("formatEnvPayload quotes values with special characters", () => {
    const payload = formatEnvPayload(
      [{ key: "BONDERY_INFRA_GIT_SHA", value: "abc def" }],
      quoteEnvValue,
    );

    assert.equal(payload, 'BONDERY_INFRA_GIT_SHA="abc def"');
  });
});
