#!/usr/bin/env tsx
/**
 * One-time migration: Supabase Auth → Better Auth tables.
 *
 * Prerequisites:
 * - `DATABASE_URL` points at the target Prisma/Better Auth database
 * - Source Supabase `auth` schema still reachable (or a JSON/SQL export on disk)
 *
 * Mapping sketch (implement when running production cutover):
 * - `auth.users` → `User`
 * - `auth.identities` / provider metadata → `Account`
 * - active sessions / refresh tokens → `Session`
 *
 * Usage:
 *   cd archive/supabase-db
 *   DATABASE_URL=... tsx scripts/migrate-auth-from-supabase.ts
 *
 * See packages/db/README.md for the full migration runbook (TODO).
 */
console.error("migrate-auth-from-supabase: not implemented yet");
process.exit(1);
