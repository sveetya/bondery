/** Shared dummy env for API integration tests (no .env file required). */

import { applyApiBootEnv } from "@bondery/helpers/env";

export function loadTestEnv(): void {
  applyApiBootEnv();
}
