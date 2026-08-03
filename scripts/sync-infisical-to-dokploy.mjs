/**
 * Sync Infisical production env (opsSync keys) to Dokploy compose environment.
 *
 * Prerequisites: Infisical secrets-action has loaded production keys into process.env.
 *
 * Usage:
 *   node scripts/sync-infisical-to-dokploy.mjs --target ops [--dry-run] [--redeploy]
 */

import { pathToFileURL } from "node:url";
import { collectOpsSyncRows, OPS_DOKPLOY_SYNC_CONFIG_KEYS } from "@bondery/helpers/env";
import { parseEnvContent } from "@bondery/helpers/env/check-env";

/** @see scripts/env-file-format.ts */
export function quoteEnvValue(value) {
  if (/[\s#"'$\\]/.test(value) || value === "") {
    return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  }
  return value;
}

const REQUIRED_DOKPLOY_CONFIG_KEYS = OPS_DOKPLOY_SYNC_CONFIG_KEYS.filter(
  (key) => key !== "BONDERY_OPS_DOKPLOY_OPS_DEPLOY_WEBHOOK",
);

/** @typedef {{ host: string; apiKey: string; composeId: string; deployWebhook: string }} DokployConfig */

/**
 * @param {Record<string, string | undefined>} env
 * @returns {DokployConfig}
 */
export function readDokployConfig(env) {
  const missing = [];
  for (const key of REQUIRED_DOKPLOY_CONFIG_KEYS) {
    const value = env[key]?.trim();
    if (!value) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    console.error("sync-infisical-to-dokploy: missing required Infisical keys:");
    for (const key of missing) {
      console.error(`  - ${key}`);
    }
    process.exit(1);
  }

  return {
    apiKey: env.BONDERY_OPS_DOKPLOY_API_KEY.trim(),
    composeId: env.BONDERY_OPS_DOKPLOY_OPS_COMPOSE_ID.trim(),
    deployWebhook: env.BONDERY_OPS_DOKPLOY_OPS_DEPLOY_WEBHOOK?.trim() ?? "",
    host: env.BONDERY_OPS_DOKPLOY_HOST.trim().replace(/\/$/, ""),
  };
}

/**
 * Keys written to Dokploy (never includes connection config keys).
 *
 * @param {Record<string, string | undefined>} env
 */
export function buildOpsUploadPayload(env) {
  const { missingRequired, rows } = collectOpsSyncRows(
    Object.fromEntries(
      Object.entries(env)
        .filter(([, value]) => value !== undefined)
        .map(([k, v]) => [k, v]),
    ),
  );

  if (missingRequired.length > 0) {
    console.error("sync-infisical-to-dokploy: missing required production values:");
    for (const key of missingRequired) {
      console.error(`  - ${key}`);
    }
    process.exit(1);
  }

  const uploadKeys = rows.map((row) => row.key);
  for (const configKey of OPS_DOKPLOY_SYNC_CONFIG_KEYS) {
    if (uploadKeys.includes(configKey)) {
      console.error(
        `sync-infisical-to-dokploy: internal error — config key ${configKey} in upload payload`,
      );
      process.exit(1);
    }
  }

  return { rows, uploadKeys };
}

/**
 * @param {Array<{ key: string; value: string }>} rows
 * @param {typeof quoteEnvValue} quote
 */
export function formatEnvPayload(rows, quote) {
  return rows.map((row) => `${row.key}=${quote(row.value)}`).join("\n");
}

/**
 * Merge opsSync updates into existing Dokploy env text (preserves unsynced keys).
 *
 * @param {string | null | undefined} existingEnv
 * @param {Array<{ key: string; value: string }>} rows
 * @param {typeof quoteEnvValue} quote
 */
export function mergeOpsEnv(existingEnv, rows, quote) {
  const merged = parseEnvContent(existingEnv ?? "");
  for (const row of rows) {
    merged[row.key] = row.value;
  }

  const keys = Object.keys(merged).sort((a, b) =>
    a.localeCompare(b, "en", { sensitivity: "variant" }),
  );

  return keys.map((key) => `${key}=${quote(merged[key])}`).join("\n");
}

/**
 * @param {DokployConfig} config
 */
export async function fetchComposeEnv(config) {
  const url = new URL("/api/compose.one", config.host);
  url.searchParams.set("composeId", config.composeId);

  const response = await fetch(url, {
    headers: {
      "x-api-key": config.apiKey,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    console.error(`sync-infisical-to-dokploy: compose.one failed (${response.status}): ${body}`);
    process.exit(1);
  }

  const data = await response.json();
  const env = data?.env ?? data?.result?.data?.env;
  return typeof env === "string" || env === null ? env : undefined;
}

/**
 * @param {DokployConfig} config
 * @param {string} envPayload
 */
export async function saveComposeEnv(config, envPayload) {
  const response = await fetch(new URL("/api/compose.saveEnvironment", config.host), {
    body: JSON.stringify({
      composeId: config.composeId,
      env: envPayload,
    }),
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.apiKey,
    },
    method: "POST",
  });

  if (!response.ok) {
    const body = await response.text();
    console.error(
      `sync-infisical-to-dokploy: compose.saveEnvironment failed (${response.status}): ${body}`,
    );
    process.exit(1);
  }
}

/**
 * @param {string} webhookUrl
 * @param {string} repository
 */
export async function triggerDeployWebhook(webhookUrl, repository) {
  const response = await fetch(webhookUrl, {
    body: JSON.stringify({
      ref: "refs/heads/release",
      repository: { full_name: repository },
    }),
    headers: {
      "Content-Type": "application/json",
      "X-GitHub-Event": "push",
    },
    method: "POST",
  });

  if (!response.ok) {
    const body = await response.text();
    console.error(`sync-infisical-to-dokploy: deploy webhook failed (${response.status}): ${body}`);
    process.exit(1);
  }
}

function parseArgs(argv) {
  const args = {
    dryRun: false,
    redeploy: false,
    target: "",
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--dry-run") {
      args.dryRun = true;
    } else if (arg === "--redeploy") {
      args.redeploy = true;
    } else if (arg === "--target") {
      args.target = argv[i + 1] ?? "";
      i += 1;
    }
  }

  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.target !== "ops") {
    console.error("sync-infisical-to-dokploy: only --target ops is supported in phase 1");
    process.exit(1);
  }

  const config = readDokployConfig(process.env);
  const { rows, uploadKeys } = buildOpsUploadPayload(process.env);
  const existingEnv = args.dryRun ? null : await fetchComposeEnv(config);
  const envPayload = mergeOpsEnv(existingEnv, rows, quoteEnvValue);

  console.log("sync-infisical-to-dokploy: upload keys:");
  for (const key of uploadKeys) {
    console.log(`  - ${key}`);
  }

  if (args.dryRun) {
    console.log("sync-infisical-to-dokploy: dry run — skipping Dokploy API");
    return;
  }

  await saveComposeEnv(config, envPayload);
  console.log("sync-infisical-to-dokploy: saved compose environment");

  if (args.redeploy) {
    if (!config.deployWebhook) {
      console.error(
        "sync-infisical-to-dokploy: --redeploy requires BONDERY_OPS_DOKPLOY_OPS_DEPLOY_WEBHOOK in Infisical",
      );
      process.exit(1);
    }

    const repository =
      // biome-ignore lint/suspicious/noUndeclaredEnvVars: GitHub Actions runner env, not a turbo task input
      process.env.GITHUB_REPOSITORY ?? "usebondery/bondery";
    await triggerDeployWebhook(config.deployWebhook, repository);
    console.log("sync-infisical-to-dokploy: triggered deploy webhook");
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
