#!/usr/bin/env node
/**
 * Free a local dev port. Uses fuser (reliable for WSL listeners) plus
 * process-name patterns for orphans whose parent (turbo / npm) already exited.
 */
import { execSync } from "node:child_process";

const DEFAULT_PATTERNS_BY_PORT = {
  26631: [
    "tsx watch --env-file=.env.development.local src/index.ts",
    "node --require .*/tsx/dist/preflight.cjs.*src/index.ts",
  ],
  26632: ["next dev --port 26632", "next-server \\(v"],
};

function run(command, { ignoreError = false } = {}) {
  try {
    return execSync(command, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  } catch (error) {
    if (ignoreError) {
      return [error.stdout, error.stderr].filter(Boolean).join("\n").trim();
    }
    throw error;
  }
}

function portListeners(port) {
  const out = run(`ss -tlnp 'sport = :${port}'`, { ignoreError: true });
  return out
    .split("\n")
    .filter((line) => line.includes("LISTEN") && line.includes(`:${port}`))
    .join("\n")
    .trim();
}

/**
 * @param {number} port
 * @param {{ patterns?: string[], quiet?: boolean }} [options]
 * @returns {boolean} true when the port is free afterward
 */
export function killDevPort(port, { patterns = [], quiet = false } = {}) {
  const log = quiet ? () => {} : console.log.bind(console);
  const mergedPatterns = [...patterns, ...(DEFAULT_PATTERNS_BY_PORT[port] ?? [])];

  const before = portListeners(port);
  if (!before) {
    log(`Port ${port} is already free.`);
    return true;
  }

  log(`Port ${port} in use:\n${before}`);
  log(`Killing listeners on port ${port}...`);
  run(`fuser -k ${port}/tcp`, { ignoreError: true });

  for (const pattern of mergedPatterns) {
    log(`Killing processes matching: ${pattern}`);
    run(`pkill -9 -f '${pattern}'`, { ignoreError: true });
  }

  run("sleep 0.3", { ignoreError: true });

  const after = portListeners(port);
  if (after) {
    if (!quiet) {
      console.error(`\nPort ${port} is still in use:\n${after}`);
    }
    return false;
  }

  log(`Port ${port} is free.`);
  return true;
}

function parsePortArg(value) {
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid port: ${value}`);
  }
  return port;
}

function main() {
  const ports = process.argv.slice(2).map(parsePortArg);
  if (ports.length === 0) {
    console.error("Usage: node scripts/kill-dev-port.mjs <port> [port...]");
    process.exit(1);
  }

  let ok = true;
  for (const port of ports) {
    if (!killDevPort(port)) {
      ok = false;
    }
  }

  process.exit(ok ? 0 : 1);
}

if (process.argv[1]?.endsWith("kill-dev-port.mjs")) {
  main();
}
