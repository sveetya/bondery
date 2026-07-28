import { prisma } from "@bondery/db";
import type { FastifyRequest } from "fastify";
import type { DomainContext, DomainError } from "../../domains/_shared/context.js";
import {
  deleteContactAvatarAndClearFlag,
  uploadContactAvatarAndSetFlag,
} from "../../lib/contacts/avatar-storage.js";
import { auth } from "../../lib/auth/index.js";
import { toFetchHeaders } from "../../lib/auth/request-headers.js";
import { deleteUserWithTeardown } from "../../lib/auth/teardown-user.js";
import { createAdminClient, resolveContactAvatarUrl } from "../../lib/data/supabase.js";
import { validateImageMagicBytes, validateImageUpload } from "../../lib/platform/config.js";
import { internal } from "../../lib/platform/errors/http-errors.js";

export async function updateAccountMetadata(
  ctx: DomainContext,
  input: { name?: string; middlename?: string; surname?: string },
) {
  const { client } = ctx;
  const { data, error } = await client.auth.updateUser({
    data: {
      middlename: input.middlename,
      name: input.name,
      surname: input.surname,
    },
  });

  if (error) {
    throw internal("account_failed_to_update_account");
  }

  return { data: data.user, success: true as const };
}

export async function deleteAccount(
  ctx: DomainContext,
  request: FastifyRequest,
): Promise<{ success: true }> {
  const { user, log } = ctx;
  const headers = toFetchHeaders(request);

  const profile = await prisma.user.findUnique({
    select: { email: true, id: true, name: true },
    where: { id: user.id },
  });

  const deletionUser = {
    email: profile?.email ?? user.email,
    id: user.id,
    name: profile?.name ?? null,
  };

  try {
    const session = await auth.api.getSession({ headers });
    if (session?.user) {
      await auth.api.deleteUser({ headers });
      log?.info({ userId: user.id }, "Account deleted via Better Auth");
      return { success: true };
    }
  } catch (error) {
    throw internal("account_failed_to_delete_account", error);
  }

  try {
    await deleteUserWithTeardown(deletionUser, log);
  } catch (error) {
    throw internal("account_failed_to_delete_account", error);
  }

  log?.info({ userId: user.id }, "Account deleted");
  return { success: true };
}

export async function uploadProfilePhoto(
  ctx: DomainContext,
  buffer: Buffer,
  mimeType: string,
): Promise<{ success: true; data: { avatarUrl: string } }> {
  const { client, user } = ctx;
  const adminClient = createAdminClient();

  const validation = validateImageUpload({ size: buffer.length, type: mimeType });
  if (!validation.isValid) {
    throw new DomainError(validation.error ?? "Invalid upload", 400, "account_invalid");
  }

  if (!validateImageMagicBytes(buffer)) {
    throw new DomainError(
      "File content does not match a valid image format",
      400,
      "account_photo_invalid_format",
    );
  }

  try {
    await uploadContactAvatarAndSetFlag(client, adminClient, user.id, user.id, buffer, mimeType);
  } catch {
    throw internal("account_failed_to_upload_profile_photo");
  }

  const avatarUrl = resolveContactAvatarUrl(client, user.id, {
    hasAvatar: true,
    id: user.id,
    updatedAt: new Date().toISOString(),
  });

  if (!avatarUrl) {
    throw internal("account_failed_to_generate_avatar_url");
  }

  return { data: { avatarUrl }, success: true };
}

export async function deleteProfilePhoto(ctx: DomainContext): Promise<{ success: true }> {
  const { client, user } = ctx;
  const adminClient = createAdminClient();
  await deleteContactAvatarAndClearFlag(client, adminClient, user.id, user.id);
  return { success: true };
}
