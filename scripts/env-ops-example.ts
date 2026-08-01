import { writeFileSync } from "node:fs";
import { join } from "node:path";
import type { createCliLogger } from "@bondery/helpers/cli";
import {
  ENV_MANIFEST,
  OPS_GROUP_GUIDES,
  resolveExampleValue,
  sortOpsExampleRows,
} from "@bondery/helpers/env";
import { formatEnvFile, OPS_GENERATED_HEADER } from "./env-file-format.js";

export function collectOpsExampleRows(packageVersion: string) {
  const rows = [];
  for (const entry of ENV_MANIFEST) {
    const ops = entry.opsExample;
    if (!ops?.include) {
      continue;
    }
    const group = ops.group ?? entry.group;
    let value = resolveExampleValue(entry, "ops");
    if (entry.canonical === "BONDERY_INFRA_VERSION" && !ops.value) {
      value = packageVersion;
    }
    if (
      entry.canonical === "BONDERY_INFRA_WEBSITE_IMAGE_TAG" &&
      ops.commented &&
      !ops.value
    ) {
      value = packageVersion;
    }
    rows.push({
      commented: ops.commented ?? false,
      description: entry.description,
      group,
      key: entry.canonical,
      value,
    });
  }
  return sortOpsExampleRows(rows);
}

export function writeOpsExample(
  repoRoot: string,
  dryRun: boolean,
  packageVersion: string,
  log: ReturnType<typeof createCliLogger>,
) {
  const rows = collectOpsExampleRows(packageVersion);
  const opsPath = join(repoRoot, "deploy/ops/.env.example");
  const body = formatEnvFile(rows, {
    groupGuides: OPS_GROUP_GUIDES,
    header: OPS_GENERATED_HEADER,
    includeDescriptions: false,
  });
  if (!dryRun) {
    writeFileSync(opsPath, body, "utf-8");
  }
  log.info(`${dryRun ? "Would write" : "Wrote"} ${opsPath}`);
}
