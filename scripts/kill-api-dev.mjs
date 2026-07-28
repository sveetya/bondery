#!/usr/bin/env node
import { killDevPort } from "./kill-dev-port.mjs";

process.exit(killDevPort(26631) ? 0 : 1);
