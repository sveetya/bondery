import { writeFileSync } from "node:fs";
import { join } from "node:path";
import type { createCliLogger } from "@bondery/helpers/cli";
import {
  DEPLOY_GROUP_GUIDES,
  ENV_MANIFEST,
  resolveExampleValue,
  sortDeployExampleRows,
} from "@bondery/helpers/env";
import { DEPLOY_GENERATED_HEADER, formatEnvFile } from "./env-file-format.js";

export function collectDeployExampleRows(packageVersion: string) {
  const rows = [];
  for (const entry of ENV_MANIFEST) {
    const deploy = entry.deployExample;
    if (!deploy?.include) {
      continue;
    }
    const group = deploy.group ?? entry.group;
    let value = resolveExampleValue(entry, "deploy");
    if (entry.canonical === "BONDERY_INFRA_VERSION" && deploy.commented && !deploy.value) {
      value = packageVersion;
    }
    rows.push({
      commented: deploy.commented ?? false,
      description: entry.description,
      group,
      key: entry.canonical,
      value,
    });
  }
  return sortDeployExampleRows(rows);
}

export function writeDeployExample(
  repoRoot: string,
  dryRun: boolean,
  packageVersion: string,
  log: ReturnType<typeof createCliLogger>,
) {
  const rows = collectDeployExampleRows(packageVersion);
  const deployPath = join(repoRoot, "deploy/bondery/.env.example");
  const body = formatEnvFile(rows, {
    groupGuides: DEPLOY_GROUP_GUIDES,
    header: DEPLOY_GENERATED_HEADER,
    includeDescriptions: false,
  });
  if (!dryRun) {
    writeFileSync(deployPath, body, "utf-8");
  }
  log.info(`${dryRun ? "Would write" : "Wrote"} ${deployPath}`);
}
