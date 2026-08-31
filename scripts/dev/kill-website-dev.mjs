#!/usr/bin/env node
import { killDevPort } from "./kill-dev-port.mjs";

process.exit(killDevPort(26630) ? 0 : 1);
