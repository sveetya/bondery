# Schema conventions

Grounded in `packages/db/prisma/schema.prisma` and its generated migrations.

## Primary keys

Existing entity models generally use:

```prisma
id String @id @default(uuid()) @db.Uuid
```

That Prisma default is application-generated UUIDv4. Keep existing IDs intact, but use UUIDv7 for new ID generation. See [uuidv7-strategy.md](./uuidv7-strategy.md).

Legitimate non-UUID keys already exist:

- Composite join keys such as `@@id([interactionId, personId])`
- Protocol sequences such as `SyncChangeLog.serverSequence BigInt @id`
- Provider-owned natural keys such as `PendingSubscription.stripeSubscriptionId`

Do not force UUIDs onto protocol sequences, join-table composite keys, or externally owned identifiers.

## Relations and deletion

The dominant ownership pattern is `onDelete: Cascade`:

- User → tenant-owned data
- People → phones, emails, addresses, socials, dates
- Interaction → participants

Use `SetNull` only when the child remains meaningful without its former parent, such as optional OAuth token/session links.

For every new relation, decide explicitly:

| Behavior | Use when |
|----------|----------|
| `Cascade` | Child is owned by and meaningless without parent |
| `SetNull` | Child remains valid independently |
| `Restrict` | Deleting parent would violate a business invariant |

Do not rely on Prisma defaults for important ownership edges; state `onDelete` explicitly.

## Types

- IDs and foreign keys: `String @db.Uuid`
- Instants: `DateTime @db.Timestamptz(6)` where schema already follows that convention
- Arbitrary user text: Postgres `text` via Prisma `String`
- Money: integer minor units or explicit decimal/numeric semantics; never float
- Geographic points: `Unsupported("geography(Point,4326)")?`

PostGIS fields are not available through Prisma's typed field API. See [raw-sql-and-postgis.md](./raw-sql-and-postgis.md).

## Indexes and uniqueness

Add indexes based on actual query shapes:

- Foreign keys used for joins or cascades
- Tenant filters (`userId`) combined with frequent equality/range predicates
- Composite unique constraints for join tables (`personId`, `groupId`)
- Sort columns when paired with a selective filter

Composite index order: equality predicates first, then range/sort columns. Use the upstream `supabase-postgres-best-practices` `query-*` and `schema-*` references for generic index design and `EXPLAIN (ANALYZE, BUFFERS)` interpretation.

Do not copy every legacy `apps/supabase-db` index blindly. Validate against current Prisma/API query paths.

## Schema and migration must agree

Known drift:

- `People.lastInteractionActivity` has no explicit `onDelete` in Prisma (therefore Prisma assumes Restrict)
- `prisma/migrations/0_init/migration.sql` uses `ON DELETE SET NULL`

Review generated SQL before applying a migration:

1. Compare changed Prisma relations/defaults with SQL constraints
2. Verify `ON DELETE` and `ON UPDATE`
3. Check index names and column order
4. Confirm raw SQL functions still match table/column names

## Schema checklist

- [ ] Primary-key strategy chosen intentionally (UUIDv7 for new entity IDs)
- [ ] Relation has explicit, justified `onDelete`
- [ ] Foreign-key type exactly matches referenced primary key
- [ ] Common filter/join path has a justified index
- [ ] Prisma schema and migration SQL agree
- [ ] PostGIS fields remain behind raw SQL helpers
