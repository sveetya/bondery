#!/usr/bin/env node
import { killDevPort } from "./kill-dev-port.mjs";

process.exit(killDevPort(26632) ? 0 : 1);
