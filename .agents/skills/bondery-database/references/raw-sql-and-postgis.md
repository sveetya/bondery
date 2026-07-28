# Raw SQL and PostGIS

Prisma is the default data-access layer. Raw SQL is reserved for Postgres capabilities Prisma cannot express well: PostGIS geography, pg_trgm ranking, atomic sync helpers, and reusable database functions.

## Canonical SQL location and lifecycle

`packages/db/prisma/sql/functions.sql` contains:

- Extensions
- Immutable helper functions
- Idempotent indexes
- Search, map, sync, quota, enrichment, and reporting RPCs

`packages/db/scripts/apply-sql-functions.ts` applies the file. `release-migrate.ts` runs:

1. `prisma migrate deploy`
2. SQL functions/indexes
3. OAuth client provisioning

Reusable database behavior belongs in `functions.sql`, not scattered application `$executeRaw` calls.

## Extension placement

Canonical rule lives in `bondery-core`: create extensions with `WITH SCHEMA extensions`, then schema-qualify their functions/operators.

Known gap: current `functions.sql` creates `uuid-ossp`, `pg_trgm`, `unaccent`, and `postgis` without `WITH SCHEMA extensions`. Treat this as existing drift, not a pattern to copy.

New extension work must:

- Use the `extensions` schema
- Confirm the extension supports relocation
- Qualify calls/operator classes as required
- Update existing SQL functions and indexes consistently

## Parameterized application calls

Use Prisma tagged templates:

```typescript
const rows = await client.$queryRaw<Row[]>`
  SELECT id, rank
  FROM search_people_ids(
    ${userId}::uuid,
    ${query},
    ${limit},
    ${offset}
  )
`;
```

Never interpolate user input into `$queryRawUnsafe` or `$executeRawUnsafe`.

Dynamic identifiers cannot be parameterized like values. Prefer a fixed allowlist mapped to static SQL branches.

## pg_trgm contact search

Current search path:

- SQL: `search_people_ids` in `functions.sql`
- Wrapper: `apps/api/src/lib/data/search.ts`
- Consumer: contact page query service

The function filters by `user_id`, computes unaccented trigram similarity, orders by rank, and applies Bondery's offset pagination.

The GIN expression index must match the query expression exactly. If normalization or concatenation changes, update both function and index and verify with `EXPLAIN (ANALYZE, BUFFERS)`.

Do not replace this with generic full-text search guidance: Bondery uses pg_trgm similarity, not `to_tsvector`, for names.

## PostGIS

Prisma models geography as:

```prisma
gisPoint Unsupported("geography(Point,4326)")?
```

Patterns:

- Writes through parameterized SQL helpers such as `ST_GeogFromText`
- Reads through bbox RPCs (`get_map_pins_in_bbox`, `get_map_address_pins_in_bbox`)
- Coordinates originate from Mapy geocoding

Rules:

- Use SRID 4326 consistently
- Validate longitude/latitude ranges before SQL
- Keep coordinate construction and bbox semantics in named helpers/RPCs
- Add/verify a GiST index for high-volume geography predicates
- Never attempt Prisma `select: { gisPoint: true }`; unsupported fields require raw SQL

## Raw SQL checklist

- [ ] Prisma cannot express the operation cleanly; raw SQL is justified
- [ ] Reusable SQL lives in `functions.sql`
- [ ] Application values use tagged-template parameters
- [ ] Extension objects follow `bondery-core` schema placement
- [ ] SQL function includes tenant/user filtering where required
- [ ] Search/index expressions stay identical
- [ ] PostGIS uses SRID 4326 and validated coordinate ranges
- [ ] `db:functions` and relevant API tests pass
