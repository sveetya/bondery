import { PgBoss } from "pg-boss";

let boss: PgBoss | null = null;

export function getBoss(): PgBoss {
  if (!boss) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is required for pg-boss");
    }
    boss = new PgBoss(connectionString);
  }
  return boss;
}

export async function startBoss(): Promise<PgBoss> {
  const instance = getBoss();
  await instance.start();
  return instance;
}

export async function stopBoss(): Promise<void> {
  if (boss) {
    await boss.stop();
    boss = null;
  }
}
