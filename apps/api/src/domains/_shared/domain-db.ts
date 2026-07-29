import { type PrismaClient, prisma } from "@bondery/db";

import type { DomainContext } from "./context.js";

/** Resolve Prisma client from domain context. */
export function domainDb(ctx: DomainContext): PrismaClient {
  return ctx.db ?? prisma;
}
