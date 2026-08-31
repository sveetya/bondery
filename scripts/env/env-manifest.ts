/**
 * Manifest imports for env example codegen — always from TypeScript source, never
 * `@bondery/helpers/env` dist (stale dist caused deploy pin drift vs turbo.json).
 */
export {
  collectOpsSyncRows,
  DEPLOY_GROUP_GUIDES,
  ENV_MANIFEST,
  OPS_GROUP_GUIDES,
  PLAUSIBLE_GROUP_GUIDES,
  resolveExampleValue,
  sortDeployExampleRows,
  sortOpsExampleRows,
  sortPlausibleExampleRows,
} from "../../packages/helpers/src/env/index.ts";
