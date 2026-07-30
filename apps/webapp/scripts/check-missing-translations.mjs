/**
 * @deprecated Use root `npm run check-i18n` instead.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

console.warn("check-missing-translations.mjs is deprecated. Running check-i18n…");

const result = spawnSync("npm", ["run", "check-i18n"], {
  cwd: repoRoot,
  shell: true,
  stdio: "inherit",
});
if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

console.log("check-i18n passed.");
