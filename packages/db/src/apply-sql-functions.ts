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
    console.log(`Applied ${sqlPath}`);
  } finally {
    await client.end();
  }
}
