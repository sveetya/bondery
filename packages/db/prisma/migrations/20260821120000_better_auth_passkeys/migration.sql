-- Better Auth `@better-auth/passkey` credential store.

CREATE TABLE "passkey" (
    "id" UUID NOT NULL,
    "name" TEXT,
    "public_key" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "credential_id" TEXT NOT NULL,
    "counter" INTEGER NOT NULL,
    "device_type" TEXT NOT NULL,
    "backed_up" BOOLEAN NOT NULL,
    "transports" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aaguid" TEXT,

    CONSTRAINT "passkey_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "passkey_credential_id_key" ON "passkey"("credential_id");

CREATE INDEX "passkey_user_id_idx" ON "passkey"("user_id");

ALTER TABLE "passkey" ADD CONSTRAINT "passkey_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
