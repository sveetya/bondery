import { prisma } from "@bondery/db";
import type { FastifyBaseLogger } from "fastify";
import { getPolarClient } from "../../services/billing/polar.js";
import { deletePendingSubscription } from "../../services/billing/subscription.js";
import { sendAccountDeletedEmail } from "../../services/notifications/account-deleted.js";
import { createAdminClient } from "../storage/supabase-client.js";

const LINKEDIN_LOGOS_BUCKET = "linkedin_logos";

export type UserDeletionSnapshot = {
  email: string;
  id: string;
  name?: string | null;
};

const pendingDeletionEmails = new Map<string, UserDeletionSnapshot>();

export function snapshotUserForDeletion(user: UserDeletionSnapshot): void {
  pendingDeletionEmails.set(user.id, {
    email: user.email,
    id: user.id,
    name: user.name ?? null,
  });
}

function takeDeletionSnapshot(userId: string): UserDeletionSnapshot | undefined {
  const snapshot = pendingDeletionEmails.get(userId);
  pendingDeletionEmails.delete(userId);
  return snapshot;
}

async function deleteUserStorageFiles(userId: string): Promise<void> {
  const adminClient = createAdminClient();

  const { data: avatarFiles } = await adminClient.storage.from("avatars").list(userId);
  if (avatarFiles && avatarFiles.length > 0) {
    const avatarPaths = avatarFiles.map((file) => `${userId}/${file.name}`);
    await adminClient.storage.from("avatars").remove(avatarPaths);
  }

  const { data: logoFiles } = await adminClient.storage.from(LINKEDIN_LOGOS_BUCKET).list(userId);
  if (logoFiles && logoFiles.length > 0) {
    const logoPaths = logoFiles.map((file) => `${userId}/${file.name}`);
    await adminClient.storage.from(LINKEDIN_LOGOS_BUCKET).remove(logoPaths);
  }
}

async function deleteOAuthArtifactsForUser(userId: string): Promise<void> {
  await prisma.$transaction([
    prisma.oauthAccessToken.deleteMany({ where: { userId } }),
    prisma.oauthRefreshToken.deleteMany({ where: { userId } }),
    prisma.oauthConsent.deleteMany({ where: { userId } }),
  ]);
}

async function cancelPolarSubscriptionIfAny(
  userId: string,
  log?: FastifyBaseLogger,
): Promise<void> {
  const subscription = await prisma.subscription.findFirst({
    select: { polarSubscriptionId: true, status: true },
    where: { userId },
  });

  if (!subscription?.polarSubscriptionId) {
    return;
  }

  if (subscription.status === "canceled") {
    return;
  }

  try {
    const polar = getPolarClient();
    await polar.subscriptions.revoke({ id: subscription.polarSubscriptionId });
  } catch (error) {
    log?.warn(
      { err: error, polarSubscriptionId: subscription.polarSubscriptionId, userId },
      "Failed to revoke Polar subscription during account deletion",
    );
  }
}

export async function runUserDeleteBefore(
  user: UserDeletionSnapshot,
  log?: FastifyBaseLogger,
): Promise<void> {
  snapshotUserForDeletion(user);
  await deleteUserStorageFiles(user.id);
  await deleteOAuthArtifactsForUser(user.id);
  await cancelPolarSubscriptionIfAny(user.id, log);

  try {
    await deletePendingSubscription(user.email);
  } catch (error) {
    log?.warn({ err: error, userId: user.id }, "Failed to delete pending subscription row");
  }
}

export async function runUserDeleteAfter(
  user: UserDeletionSnapshot,
  log?: FastifyBaseLogger,
): Promise<void> {
  const snapshot = takeDeletionSnapshot(user.id) ?? user;

  try {
    await sendAccountDeletedEmail(
      {
        email: snapshot.email,
        userName: snapshot.name,
      },
      log,
    );
  } catch (error) {
    log?.error({ err: error, userId: user.id }, "Failed to send account-deleted email");
  }
}

export async function deleteUserWithTeardown(
  user: UserDeletionSnapshot,
  log?: FastifyBaseLogger,
): Promise<void> {
  await runUserDeleteBefore(user, log);

  let prismaDeleted = false;
  try {
    await prisma.user.delete({ where: { id: user.id } });
    prismaDeleted = true;
  } catch (error) {
    log?.warn({ err: error, userId: user.id }, "Prisma user delete failed during account teardown");
  }

  const adminClient = createAdminClient();
  const { error: supabaseDeleteError } = await adminClient.auth.admin.deleteUser(user.id);
  if (supabaseDeleteError && !prismaDeleted) {
    throw supabaseDeleteError;
  }
  if (supabaseDeleteError) {
    log?.warn(
      { err: supabaseDeleteError, userId: user.id },
      "Supabase auth user delete failed after Prisma user was removed",
    );
  }

  await runUserDeleteAfter(user, log);
}
