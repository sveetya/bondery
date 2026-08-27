import { spawn } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readdirSync, utimesSync, watch } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const repoRoot = resolve(packageRoot, "../..");

const srcLocales = join("src", "locales");
const distLocales = join("dist", "locales");
const distResourceMap = join("dist", "generated", "resources.js");

function copyRecursive(src, dest) {
  if (!existsSync(src)) {
    return;
  }
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);
    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else if (entry.name.endsWith(".json")) {
      copyFileSync(srcPath, destPath);
    }
  }
}

function syncArtifacts() {
  copyRecursive(srcLocales, distLocales);
  if (existsSync("manifest.json")) {
    mkdirSync("dist", { recursive: true });
    copyFileSync("manifest.json", join("dist", "manifest.json"));
  }
  // Next caches JSON imports from this module; bump mtime so locale edits reload.
  if (existsSync(distResourceMap)) {
    const now = new Date();
    utimesSync(distResourceMap, now, now);
  }
}

syncArtifacts();

let syncTimer;
function scheduleLocaleSync(reason) {
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    syncArtifacts();
    console.log(`[translations] copied locale JSON → dist (${reason})`);
  }, 50);
}

if (existsSync(srcLocales)) {
  // Windows often emits `rename` for atomic saves; do not filter to `change`.
  watch(srcLocales, { recursive: true }, (eventType, filename) => {
    const file = typeof filename === "string" ? filename : "";
    scheduleLocaleSync(file ? `${eventType}: ${file}` : eventType);
  });
}

spawn(process.execPath, [join(packageRoot, "scripts/generate-resource-map.mjs")], {
  cwd: packageRoot,
  stdio: "inherit",
});

const tsc = spawn(
  process.execPath,
  [join(repoRoot, "node_modules/typescript/bin/tsc"), "--watch", "--preserveWatchOutput"],
  { cwd: packageRoot, stdio: "inherit" },
);

tsc.on("exit", (code) => {
  process.exit(code ?? 0);
});

process.on("SIGINT", () => {
  tsc.kill("SIGINT");
  process.exit(0);
});
