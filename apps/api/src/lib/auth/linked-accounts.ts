import { prisma } from "@bondery/db";

export type LinkedAccountIdentityRow = {
  id: string;
  user_id: string;
  identity_id: string;
  provider: string;
};

/** Maps Better Auth `account` rows to the client-facing identity shape. */
export async function listUserIdentityRows(userId: string): Promise<LinkedAccountIdentityRow[]> {
  const accounts = await prisma.account.findMany({
    select: {
      id: true,
      providerAccountId: true,
      providerId: true,
      userId: true,
    },
    where: { userId },
  });

  return accounts.map((account) => ({
    id: account.id,
    identity_id: account.providerAccountId,
    provider: account.providerId,
    user_id: account.userId,
  }));
}

export async function listUserProviderIds(userId: string): Promise<string[]> {
  const accounts = await prisma.account.findMany({
    distinct: ["providerId"],
    select: { providerId: true },
    where: { userId },
  });

  return accounts.map((account) => account.providerId);
}
