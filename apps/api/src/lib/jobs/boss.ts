import { PgBoss } from "pg-boss";

let boss: PgBoss | null = null;
let bossConnectionString: string | null = null;

export function getBoss(): PgBoss {
  if (!boss) {
    throw new Error("pg-boss not started; call startBoss first");
  }
  return boss;
}

export async function startBoss(connectionString: string): Promise<PgBoss> {
  const trimmed = connectionString.trim();
  if (!trimmed) {
    throw new Error("DATABASE_URL is required for pg-boss");
  }

  if (bossConnectionString && bossConnectionString !== trimmed) {
    throw new Error("DATABASE_URL changed after pg-boss started; restart the process");
  }

  if (!boss) {
    bossConnectionString = trimmed;
    boss = new PgBoss(trimmed);
  }

  await boss.start();
  return boss;
}

export async function stopBoss(): Promise<void> {
  if (boss) {
    await boss.stop();
    boss = null;
    bossConnectionString = null;
  }
}

/** @internal Test-only reset. */
export function resetBossForTests(): void {
  boss = null;
  bossConnectionString = null;
}
