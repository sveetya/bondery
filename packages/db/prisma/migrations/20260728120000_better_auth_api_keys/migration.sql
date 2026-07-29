-- Hard cutover: legacy pepper-hashed api_keys → Better Auth apikey table.
-- Existing keys are invalidated; users must create new keys.

DROP TABLE IF EXISTS "api_keys";

CREATE TABLE "apikey" (
    "id" UUID NOT NULL,
    "config_id" TEXT NOT NULL DEFAULT 'default',
    "name" TEXT,
    "start" TEXT,
    "prefix" TEXT,
    "key" TEXT NOT NULL,
    "reference_id" UUID NOT NULL,
    "refill_interval" INTEGER,
    "refill_amount" INTEGER,
    "last_refill_at" TIMESTAMP(3),
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "rate_limit_enabled" BOOLEAN NOT NULL DEFAULT false,
    "rate_limit_time_window" INTEGER,
    "rate_limit_max" INTEGER,
    "request_count" INTEGER NOT NULL DEFAULT 0,
    "remaining" INTEGER,
    "last_request" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "permissions" TEXT,
    "metadata" TEXT,

    CONSTRAINT "apikey_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "apikey_reference_id_idx" ON "apikey"("reference_id");
CREATE INDEX "apikey_config_id_idx" ON "apikey"("config_id");
CREATE INDEX "apikey_key_idx" ON "apikey"("key");

ALTER TABLE "apikey" ADD CONSTRAINT "apikey_reference_id_fkey" FOREIGN KEY ("reference_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
