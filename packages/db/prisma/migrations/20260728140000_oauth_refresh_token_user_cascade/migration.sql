-- Allow user deletion to cascade OAuth refresh tokens (account delete / Better Auth deleteUser).
ALTER TABLE "oauth_refresh_token" DROP CONSTRAINT "oauth_refresh_token_user_id_fkey";

ALTER TABLE "oauth_refresh_token"
  ADD CONSTRAINT "oauth_refresh_token_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
