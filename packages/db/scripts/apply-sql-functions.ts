#!/usr/bin/env tsx
/**
 * Applies prisma/sql/functions.sql (extensions + custom Postgres functions)
 * against DATABASE_URL. Run after `prisma migrate deploy`.
 *
 * Usage: tsx scripts/apply-sql-functions.ts
 */
import { applySqlFunctions } from "../src/apply-sql-functions.js";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  await applySqlFunctions(databaseUrl);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export { applySqlFunctions } from "../src/apply-sql-functions.js";
