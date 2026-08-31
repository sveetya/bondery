-- Track last successful passkey authentication for Settings "last used" copy.
-- Better Auth 1.7.1 does not persist this field; we write it in afterVerification.

ALTER TABLE "passkey" ADD COLUMN "last_used_at" TIMESTAMP(3);
