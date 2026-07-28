#!/usr/bin/env node
import { killDevPort } from "./kill-dev-port.mjs";

const ports = [26631, 26632];
let ok = true;

for (const port of ports) {
  if (!killDevPort(port)) {
    ok = false;
  }
}

process.exit(ok ? 0 : 1);
