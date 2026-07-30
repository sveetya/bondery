import type { Redis } from "ioredis";
import type { Pool } from "pg";

export type RuntimeDeps = {
  databaseUrl: string;
  pool: Pool;
  redis: {
    commands: Redis;
    subscriber: Redis;
  };
};
