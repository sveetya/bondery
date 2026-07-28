-- Better Auth 1.7 upgrade: OAuth-provider persistence + Account.issuer.
--
-- This is an EXPAND-only migration: it only adds columns/tables and
-- backfills data. Nothing is dropped or renamed at the SQL level, so a
-- rollback to the pre-1.7 API build keeps working against this schema
-- unmodified (the pre-1.7 code simply never reads the new columns/tables).
--
-- The Account.accountId -> Account.providerAccountId and
-- Account.issuer changes introduced by Better Auth 1.7 are handled WITHOUT
-- renaming the underlying "account_id" column: the Prisma model maps the
-- new field name onto the existing column via `@map`. Only `issuer` is a
-- real new column, and it is deterministic for our exactly two social
-- providers (github, linkedin): Better Auth computes
-- `local:oauth:<providerId>` for every OAuth-linked account
-- (`createOAuthAccountIssuer`, verified against the installed 1.7 SDK).
-- The backfill aborts (via the CHECK below) if any other provider_id is
-- ever found, matching the plan's "abort on unknown providers" requirement.

-- CreateTable / AlterTable: Account.issuer -------------------------------

ALTER TABLE "account" ADD COLUMN "issuer" TEXT;

UPDATE "account"
SET "issuer" = 'local:oauth:' || "provider_id"
WHERE "provider_id" IN ('github', 'linkedin');

-- Preflight guard: fail the migration loudly instead of silently leaving
-- NULL issuers (and instead of guessing an issuer) if an account with an
-- unexpected provider_id shows up.
DO $$
DECLARE
  unknown_count integer;
BEGIN
  SELECT count(*) INTO unknown_count FROM "account" WHERE "issuer" IS NULL;
  IF unknown_count > 0 THEN
    RAISE EXCEPTION
      'add_oauth_provider_1_7: % account row(s) have a provider_id outside {github, linkedin}; extend the issuer backfill before re-running this migration',
      unknown_count;
  END IF;
END $$;

ALTER TABLE "account" ALTER COLUMN "issuer" SET NOT NULL;

-- New composite uniqueness on (issuer, account_id). The legacy
-- (provider_id, account_id) unique index from 0_init is left in place
-- through the rollback window (dropped in a later contract migration).
CREATE UNIQUE INDEX "account_issuer_account_id_key" ON "account"("issuer", "account_id");

-- AlterTable: Jwks additional 1.7 key-rotation metadata -------------------

ALTER TABLE "jwks" ADD COLUMN "expires_at" TIMESTAMP(3);
ALTER TABLE "jwks" ADD COLUMN "alg" TEXT;
ALTER TABLE "jwks" ADD COLUMN "crv" TEXT;

-- CreateTable: oauth_client -------------------------------------------------

CREATE TABLE "oauth_client" (
    "id" UUID NOT NULL,
    "client_id" TEXT NOT NULL,
    "client_secret" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "skip_consent" BOOLEAN,
    "enable_end_session" BOOLEAN,
    "subject_type" TEXT,
    "scopes" TEXT[],
    "user_id" UUID,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "name" TEXT,
    "uri" TEXT,
    "icon" TEXT,
    "contacts" TEXT[],
    "tos" TEXT,
    "policy" TEXT,
    "software_id" TEXT,
    "software_version" TEXT,
    "software_statement" TEXT,
    "redirect_uris" TEXT[],
    "post_logout_redirect_uris" TEXT[],
    "backchannel_logout_uri" TEXT,
    "backchannel_logout_session_required" BOOLEAN,
    "token_endpoint_auth_method" TEXT,
    "jwks" TEXT,
    "jwks_uri" TEXT,
    "grant_types" TEXT[],
    "response_types" TEXT[],
    "public" BOOLEAN,
    "type" TEXT,
    "require_pkce" BOOLEAN,
    "dpop_bound_access_tokens" BOOLEAN NOT NULL DEFAULT false,
    "reference_id" TEXT,
    "metadata" JSONB,

    CONSTRAINT "oauth_client_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "oauth_client_client_id_key" ON "oauth_client"("client_id");
CREATE INDEX "oauth_client_user_id_idx" ON "oauth_client"("user_id");

ALTER TABLE "oauth_client" ADD CONSTRAINT "oauth_client_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable: oauth_resource -----------------------------------------------

CREATE TABLE "oauth_resource" (
    "id" UUID NOT NULL,
    "identifier" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "access_token_ttl" INTEGER,
    "refresh_token_ttl" INTEGER,
    "signing_algorithm" TEXT,
    "signing_key_id" TEXT,
    "allowed_scopes" TEXT[],
    "custom_claims" JSONB,
    "dpop_bound_access_tokens_required" BOOLEAN NOT NULL DEFAULT false,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "policy_version" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB,

    CONSTRAINT "oauth_resource_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "oauth_resource_identifier_key" ON "oauth_resource"("identifier");

-- CreateTable: oauth_client_resource -----------------------------------------

CREATE TABLE "oauth_client_resource" (
    "id" UUID NOT NULL,
    "client_id" TEXT NOT NULL,
    "resource_id" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oauth_client_resource_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "oauth_client_resource_client_id_idx" ON "oauth_client_resource"("client_id");
CREATE INDEX "oauth_client_resource_resource_id_idx" ON "oauth_client_resource"("resource_id");

ALTER TABLE "oauth_client_resource" ADD CONSTRAINT "oauth_client_resource_client_id_fkey"
  FOREIGN KEY ("client_id") REFERENCES "oauth_client"("client_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "oauth_client_resource" ADD CONSTRAINT "oauth_client_resource_resource_id_fkey"
  FOREIGN KEY ("resource_id") REFERENCES "oauth_resource"("identifier") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: oauth_refresh_token --------------------------------------------

CREATE TABLE "oauth_refresh_token" (
    "id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "session_id" UUID,
    "user_id" UUID NOT NULL,
    "reference_id" TEXT,
    "authorization_code_id" TEXT,
    "resources" TEXT[],
    "requested_user_info_claims" TEXT[],
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "revoked" TIMESTAMP(3),
    "rotated_at" TIMESTAMP(3),
    "rotation_replay_response" TEXT,
    "rotation_replay_expires_at" TIMESTAMP(3),
    "auth_time" TIMESTAMP(3),
    "confirmation" JSONB,
    "scopes" TEXT[] NOT NULL,

    CONSTRAINT "oauth_refresh_token_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "oauth_refresh_token_token_key" ON "oauth_refresh_token"("token");
CREATE INDEX "oauth_refresh_token_client_id_idx" ON "oauth_refresh_token"("client_id");
CREATE INDEX "oauth_refresh_token_session_id_idx" ON "oauth_refresh_token"("session_id");
CREATE INDEX "oauth_refresh_token_user_id_idx" ON "oauth_refresh_token"("user_id");
CREATE INDEX "oauth_refresh_token_authorization_code_id_idx" ON "oauth_refresh_token"("authorization_code_id");

ALTER TABLE "oauth_refresh_token" ADD CONSTRAINT "oauth_refresh_token_client_id_fkey"
  FOREIGN KEY ("client_id") REFERENCES "oauth_client"("client_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "oauth_refresh_token" ADD CONSTRAINT "oauth_refresh_token_session_id_fkey"
  FOREIGN KEY ("session_id") REFERENCES "session"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "oauth_refresh_token" ADD CONSTRAINT "oauth_refresh_token_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable: oauth_access_token --------------------------------------------

CREATE TABLE "oauth_access_token" (
    "id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "session_id" UUID,
    "user_id" UUID,
    "reference_id" TEXT,
    "authorization_code_id" TEXT,
    "resources" TEXT[],
    "requested_user_info_claims" TEXT[],
    "refresh_id" UUID,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "revoked" TIMESTAMP(3),
    "confirmation" JSONB,
    "scopes" TEXT[] NOT NULL,

    CONSTRAINT "oauth_access_token_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "oauth_access_token_token_key" ON "oauth_access_token"("token");
CREATE INDEX "oauth_access_token_client_id_idx" ON "oauth_access_token"("client_id");
CREATE INDEX "oauth_access_token_session_id_idx" ON "oauth_access_token"("session_id");
CREATE INDEX "oauth_access_token_user_id_idx" ON "oauth_access_token"("user_id");
CREATE INDEX "oauth_access_token_authorization_code_id_idx" ON "oauth_access_token"("authorization_code_id");
CREATE INDEX "oauth_access_token_refresh_id_idx" ON "oauth_access_token"("refresh_id");

ALTER TABLE "oauth_access_token" ADD CONSTRAINT "oauth_access_token_client_id_fkey"
  FOREIGN KEY ("client_id") REFERENCES "oauth_client"("client_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "oauth_access_token" ADD CONSTRAINT "oauth_access_token_session_id_fkey"
  FOREIGN KEY ("session_id") REFERENCES "session"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "oauth_access_token" ADD CONSTRAINT "oauth_access_token_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "oauth_access_token" ADD CONSTRAINT "oauth_access_token_refresh_id_fkey"
  FOREIGN KEY ("refresh_id") REFERENCES "oauth_refresh_token"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable: oauth_consent --------------------------------------------------

CREATE TABLE "oauth_consent" (
    "id" UUID NOT NULL,
    "client_id" TEXT NOT NULL,
    "user_id" UUID,
    "reference_id" TEXT,
    "resources" TEXT[],
    "requested_user_info_claims" TEXT[],
    "scopes" TEXT[] NOT NULL,
    "created_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "oauth_consent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "oauth_consent_client_id_idx" ON "oauth_consent"("client_id");
CREATE INDEX "oauth_consent_user_id_idx" ON "oauth_consent"("user_id");

ALTER TABLE "oauth_consent" ADD CONSTRAINT "oauth_consent_client_id_fkey"
  FOREIGN KEY ("client_id") REFERENCES "oauth_client"("client_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "oauth_consent" ADD CONSTRAINT "oauth_consent_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable: oauth_client_assertion (replay-protection ledger, no FKs) -----

CREATE TABLE "oauth_client_assertion" (
    "id" UUID NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "oauth_client_assertion_pkey" PRIMARY KEY ("id")
);
