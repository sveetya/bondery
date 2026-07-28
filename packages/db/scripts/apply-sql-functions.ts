#!/usr/bin/env tsx
/**
 * Applies prisma/sql/functions.sql (extensions + custom Postgres functions)
 * against DATABASE_URL. Run after `prisma migrate deploy`.
 *
 * Usage: tsx scripts/apply-sql-functions.ts
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { Client } from "pg";

const sqlPath = fileURLToPath(new URL("../prisma/sql/functions.sql", import.meta.url));

const EXTENSIONS_SQL = `
create extension if not exists "uuid-ossp";
create extension if not exists pg_trgm;
create extension if not exists unaccent;
create extension if not exists postgis;
`;

export async function applySqlFunctions(databaseUrl: string): Promise<void> {
  const sql = readFileSync(sqlPath, "utf8");
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    // Extensions must be committed before functions.sql is parsed — Postgres
    // validates immutable_unaccent() bodies at CREATE time and needs unaccent()
    // to already exist in the catalog.
    await client.query(EXTENSIONS_SQL);
    await client.query(sql);
    // biome-ignore lint/suspicious/noConsole: CLI script output
    console.log(`Applied ${sqlPath}`);
  } finally {
    await client.end();
  }
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  await applySqlFunctions(databaseUrl);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    // biome-ignore lint/suspicious/noConsole: CLI script output
    console.error(error);
    process.exit(1);
  });
}
