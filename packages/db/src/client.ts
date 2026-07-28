import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

import { PrismaClient as BasePrismaClient } from "./generated/prisma/client.js";
import { injectCreateIds } from "./inject-create-ids.js";

const globalForPrisma = globalThis as unknown as {
  pool?: Pool;
  prisma?: ReturnType<typeof createPrismaClient>;
};

function resolveDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }
  return databaseUrl;
}

function createPool(): Pool {
  return new Pool({ connectionString: resolveDatabaseUrl() });
}

function createPrismaClient() {
  const pool = globalForPrisma.pool ?? createPool();
  const adapter = new PrismaPg(pool);

  return new BasePrismaClient({ adapter }).$extends({
    query: {
      $allModels: {
        async create({ args, query }) {
          args.data = injectCreateIds(args.data);
          return query(args);
        },
        async createMany({ args, query }) {
          args.data = injectCreateIds(args.data);
          return query(args);
        },
        async upsert({ args, query }) {
          args.create = injectCreateIds(args.create);
          return query(args);
        },
      },
    },
  });
}

export type PrismaClient = ReturnType<typeof createPrismaClient>;

/**
 * Singleton Prisma client. In dev, `tsx watch` re-evaluates modules on
 * every reload — stash the client on `globalThis` so we don't exhaust
 * Postgres connections across reloads.
 */
export const prisma: PrismaClient = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.pool = globalForPrisma.pool ?? createPool();
  globalForPrisma.prisma = prisma;
}

export type { PrismaClient as BasePrismaClient } from "./generated/prisma/client.js";
