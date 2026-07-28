# Query patterns

Bondery-specific Prisma patterns. For generic index, N+1, pooling, and `EXPLAIN` guidance, read `supabase-postgres-best-practices`.

## Select only required fields

List/detail queries generally use shared selects such as `apps/api/src/lib/data/select-fragments.ts`.

Prefer:

```typescript
client.people.findMany({
  select: peopleContactPrismaSelect,
  where: { userId: user.id },
});
```

Use `include` only when the complete relation is genuinely required. Wide nested includes increase transfer, serialization, and accidental data exposure.

## Batch reads and writes

Established patterns:

- `createMany({ skipDuplicates: true })` for group/tag membership
- `deleteMany` + `createMany` for replace-all child collections
- `where: { id: { in: ids } }` then in-memory maps
- `get_contact_extras(userId, uuid[])` RPC for batched contact enrichment

Avoid `Promise.all(ids.map(id => prisma...))`: parallel N+1 is still N+1.

## Transactions

Use `$transaction` when multiple writes must commit together. Existing replace-all pattern:

```typescript
await client.$transaction(async (tx) => {
  await tx.peopleAddress.deleteMany({ where: { personId, userId } });
  await tx.peopleAddress.createMany({ data: rows });
});
```

Rules:

- Scope every operation by the authenticated user where applicable (`bondery-security`)
- Validate external data before opening the transaction
- Perform external side effects after commit, with retry/idempotency where needed
- Prefer one batch operation over many per-row writes

## Pagination

Bondery public API contract is **offset pagination only** (`limit`, `offset`) and is owned by `bondery-api`.

Prisma implementation:

```typescript
findMany({ skip: offset, take: limit, orderBy, where })
```

Do not introduce cursor parameters into API endpoints. For internal high-volume maintenance jobs, keyset iteration may be used without changing the public contract; document it as an internal implementation detail.

Always include deterministic ordering with a stable tie-breaker.

## Parallel independent queries

Page rows and counts are independent and may run together:

```typescript
const [rows, count] = await Promise.all([
  client.people.findMany(...),
  client.people.count(...),
]);
```

Do not parallelize dependent writes or operations that must share one transaction.

## Raw SQL boundaries

Raw SQL wrappers should return narrow typed rows and live near the domain/data layer:

- `lib/data/search.ts`
- `services/contacts/queries-map.ts`
- `lib/sync/*`

See [raw-sql-and-postgis.md](./raw-sql-and-postgis.md).

## Performance review

For a changed hot query:

1. Capture representative parameters and data volume
2. Run `EXPLAIN (ANALYZE, BUFFERS)` in a non-production environment
3. Check row-estimate errors, sequential scans, sorts, and buffer reads
4. Add the smallest index that serves the real predicate/order
5. Re-run and record evidence

Do not add speculative indexes. Every index costs write I/O and storage.

## Query checklist

- [ ] Query uses a narrow `select`
- [ ] Tenant filter follows `bondery-security`
- [ ] No per-row query loop; batch read/write used
- [ ] Pagination follows `bondery-api` offset contract
- [ ] Ordering is deterministic
- [ ] Transaction is necessary and short
- [ ] Hot query/index change has `EXPLAIN` evidence
