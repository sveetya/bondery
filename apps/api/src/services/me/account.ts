import { prisma } from "@bondery/db";
import type { FastifyRequest } from "fastify";
import type { DomainContext } from "../../domains/_shared/context.js";
import { DomainError } from "../../domains/_shared/context.js";
import { auth } from "../../lib/auth/index.js";
import { toFetchHeaders } from "../../lib/auth/request-headers.js";
import {
  deleteContactAvatarAndClearFlag,
  uploadContactAvatarAndSetFlag,
} from "../../lib/contacts/avatar-storage.js";
import { validateImageMagicBytes, validateImageUpload } from "../../lib/platform/config.js";
import { internal } from "../../lib/platform/errors/http-errors.js";
import { resolveContactAvatarUrl } from "../../lib/storage/avatar-urls.js";
import { createAdminClient } from "../../lib/storage/supabase-client.js";

export async function updateAccountMetadata(
  ctx: DomainContext,
  input: { name?: string; middlename?: string; surname?: string },
) {
  const { client, user } = ctx;

  if (input.name !== undefined) {
    await prisma.user.update({
      data: { name: input.name },
      where: { id: user.id },
    });
  }

  const myselfUpdates: Record<string, string> = {};
  if (input.name !== undefined) {
    myselfUpdates.first_name = input.name;
  }
  if (input.surname !== undefined) {
    myselfUpdates.last_name = input.surname;
  }
  if (input.middlename !== undefined) {
    myselfUpdates.middlename = input.middlename;
  }

  if (Object.keys(myselfUpdates).length > 0) {
    const { error } = await client
      .from("people")
      .update(myselfUpdates)
      .eq("user_id", user.id)
      .eq("myself", true);

    if (error) {
      throw internal("account_failed_to_update_account", error);
    }
  }

  const profile = await prisma.user.findUnique({
    select: { email: true, id: true, name: true },
    where: { id: user.id },
  });

  const { data: myself } = await client
    .from("people")
    .select("first_name, last_name, middlename, has_avatar")
    .eq("user_id", user.id)
    .eq("myself", true)
    .maybeSingle();

  const avatarUrl = myself?.has_avatar
    ? resolveContactAvatarUrl(client, user.id, {
        hasAvatar: true,
        id: user.id,
      })
    : null;

  return {
    data: {
      email: profile?.email ?? user.email,
      id: user.id,
      user_metadata: {
        avatar_url: avatarUrl,
        middlename: myself?.middlename ?? undefined,
        name: myself?.first_name ?? profile?.name ?? undefined,
        surname: myself?.last_name ?? undefined,
      },
    },
    success: true as const,
  };
}

export async function deleteAccount(
  ctx: DomainContext,
  request: FastifyRequest,
): Promise<{ success: true }> {
  const { user, log } = ctx;
  const headers = toFetchHeaders(request);

  try {
    const session = await auth.api.getSession({ headers });
    if (session?.user) {
      await auth.api.deleteUser({ body: {}, headers });
      log?.info({ userId: user.id }, "Account deleted via Better Auth");
      return { success: true };
    }
  } catch (error) {
    throw internal("account_failed_to_delete_account", error);
  }

  throw internal("account_failed_to_delete_account");
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
