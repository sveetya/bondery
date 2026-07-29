-- Better Auth platform admin: role on user, drop user_settings.is_admin

ALTER TABLE "user"
  ADD COLUMN IF NOT EXISTS "role" TEXT DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS "banned" BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS "ban_reason" TEXT,
  ADD COLUMN IF NOT EXISTS "ban_expires" TIMESTAMP(3);

ALTER TABLE "session"
  ADD COLUMN IF NOT EXISTS "impersonated_by" TEXT;

UPDATE "user" u
SET "role" = 'admin'
FROM "user_settings" us
WHERE us.user_id = u.id
  AND us.is_admin = true
  AND (u.role IS NULL OR u.role = 'user');

ALTER TABLE "user_settings" DROP COLUMN IF EXISTS "is_admin";
