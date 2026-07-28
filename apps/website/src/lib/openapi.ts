import path from "node:path";
import { fileURLToPath } from "node:url";
import { createOpenAPI } from "fumadocs-openapi/server";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");

export const openapi = createOpenAPI({
  input: [path.join(repoRoot, "apps/api/openapi.yaml")],
});
