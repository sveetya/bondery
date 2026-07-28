-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "color_scheme" AS ENUM ('light', 'dark', 'auto');

-- CreateEnum
CREATE TYPE "supported_locale" AS ENUM ('en', 'cs', 'de');

-- CreateTable
CREATE TABLE "user" (
    "id" UUID NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" UUID NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "user_id" UUID NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" UUID NOT NULL,
    "account_id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "id_token" TEXT,
    "access_token_expires_at" TIMESTAMP(3),
    "refresh_token_expires_at" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" UUID NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jwks" (
    "id" UUID NOT NULL,
    "public_key" TEXT NOT NULL,
    "private_key" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "jwks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_settings" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "language" "supported_locale" NOT NULL DEFAULT 'en',
    "timezone" TEXT,
    "time_format" TEXT NOT NULL DEFAULT '24h',
    "color_scheme" "color_scheme" NOT NULL DEFAULT 'auto',
    "left_swipe_action" TEXT NOT NULL DEFAULT 'none',
    "right_swipe_action" TEXT NOT NULL DEFAULT 'none',
    "group_sort_order" TEXT NOT NULL DEFAULT 'alphabetical',
    "tag_sort_order" TEXT NOT NULL DEFAULT 'alphabetical',
    "reminder_send_hour" TEXT NOT NULL DEFAULT '09:00',
    "next_reminder_at_utc" TIMESTAMP(3) NOT NULL,
    "is_admin" BOOLEAN NOT NULL DEFAULT false,
    "onboarding_completed_at" TIMESTAMP(3),
    "getting_started_dismissed_at" TIMESTAMP(3),
    "import_completed_at" TIMESTAMP(3),
    "import_followup_platform" TEXT,
    "import_followup_status" TEXT,
    "ai_messages_used" INTEGER NOT NULL DEFAULT 0,
    "ai_messages_this_month" INTEGER NOT NULL DEFAULT 0,
    "ai_messages_month_reset_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "people" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "first_name" TEXT NOT NULL,
    "middle_name" TEXT,
    "last_name" TEXT,
    "headline" TEXT,
    "notes" TEXT,
    "notes_updated_at" TIMESTAMP(3),
    "myself" BOOLEAN DEFAULT false,
    "has_avatar" BOOLEAN NOT NULL DEFAULT false,
    "language" TEXT,
    "timezone" TEXT,
    "location" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "gisPoint" geography(Point,4326),
    "keep_frequency_days" INTEGER,
    "last_interaction" TIMESTAMP(3),
    "last_interaction_activity_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "people_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "people_phones" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "person_id" UUID NOT NULL,
    "value" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'mobile',
    "prefix" TEXT NOT NULL DEFAULT '',
    "preferred" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "people_phones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "people_emails" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "person_id" UUID NOT NULL,
    "value" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'personal',
    "preferred" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "people_emails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "people_socials" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "person_id" UUID NOT NULL,
    "platform" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "connected_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "people_socials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "people_addresses" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "person_id" UUID NOT NULL,
    "label" TEXT,
    "type" TEXT NOT NULL DEFAULT 'home',
    "value" TEXT NOT NULL,
    "address_line1" TEXT,
    "address_line2" TEXT,
    "address_city" TEXT,
    "address_state" TEXT,
    "address_state_code" TEXT,
    "address_postal_code" TEXT,
    "address_country" TEXT,
    "address_country_code" TEXT,
    "address_formatted" TEXT,
    "address_granularity" TEXT NOT NULL DEFAULT 'unknown',
    "address_geocode_source" TEXT,
    "geocode_confidence" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "gisPoint" geography(Point,4326),
    "timezone" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "people_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "people_important_dates" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "person_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "note" TEXT,
    "notify_on" DATE,
    "notify_days_before" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "people_important_dates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "people_relationships" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "source_person_id" UUID NOT NULL,
    "target_person_id" UUID NOT NULL,
    "relationship_type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "people_relationships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "groups" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "color" TEXT,
    "emoji" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "people_groups" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "person_id" UUID NOT NULL,
    "group_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "people_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "color" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "people_tags" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "person_id" UUID NOT NULL,
    "tag_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "people_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interactions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interaction_participants" (
    "interaction_id" UUID NOT NULL,
    "person_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interaction_participants_pkey" PRIMARY KEY ("interaction_id","person_id")
);

-- CreateTable
CREATE TABLE "people_linkedin" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "person_id" UUID NOT NULL,
    "bio" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "people_linkedin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "people_work_history" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "people_linkedin_id" UUID NOT NULL,
    "company_name" TEXT NOT NULL,
    "company_linkedin_id" TEXT,
    "title" TEXT,
    "employment_type" TEXT,
    "location" TEXT,
    "description" TEXT,
    "start_date" DATE,
    "end_date" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "people_work_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "people_education_history" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "people_linkedin_id" UUID NOT NULL,
    "school_name" TEXT NOT NULL,
    "school_linkedin_id" TEXT,
    "degree" TEXT,
    "description" TEXT,
    "start_date" DATE,
    "end_date" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "people_education_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "people_merge_recommendations" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "left_person_id" UUID NOT NULL,
    "right_person_id" UUID NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "reasons" TEXT[],
    "algorithm_version" TEXT NOT NULL DEFAULT 'v1',
    "is_declined" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "people_merge_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "linkedin_enrich_queue" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "person_id" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "linkedin_enrich_queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "geocode_cache" (
    "id" UUID NOT NULL,
    "place_key" TEXT NOT NULL,
    "place_original" TEXT NOT NULL,
    "geocode_found" BOOLEAN NOT NULL DEFAULT false,
    "formatted_label" TEXT,
    "name" TEXT,
    "city" TEXT,
    "state" TEXT,
    "state_code" TEXT,
    "country" TEXT,
    "country_code" TEXT,
    "lat" DOUBLE PRECISION,
    "lon" DOUBLE PRECISION,
    "location_ewkt" TEXT,
    "timezone" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "geocode_cache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "key_id" TEXT NOT NULL,
    "key_hash" TEXT NOT NULL,
    "key_prefix" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "permission" TEXT NOT NULL DEFAULT 'read',
    "last_used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "role" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "polar_customer_id" TEXT NOT NULL,
    "polar_subscription_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "current_period_start" TIMESTAMP(3),
    "current_period_end" TIMESTAMP(3),
    "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pending_subscriptions" (
    "polar_subscription_id" TEXT NOT NULL,
    "polar_customer_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "current_period_end" TIMESTAMP(3),
    "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pending_subscriptions_pkey" PRIMARY KEY ("polar_subscription_id")
);

-- CreateTable
CREATE TABLE "reminder_dispatch_log" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "reminder_date" DATE NOT NULL,
    "timezone" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reminder_dispatch_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_change_log" (
    "server_sequence" BIGINT NOT NULL,
    "user_id" UUID NOT NULL,
    "table_name" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "row_data" JSONB,
    "change_index" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sync_change_log_pkey" PRIMARY KEY ("server_sequence")
);

-- CreateTable
CREATE TABLE "sync_mutation_receipts" (
    "user_id" UUID NOT NULL,
    "client_mutation_id" TEXT NOT NULL,
    "mutation_type" TEXT NOT NULL,
    "payload_hash" TEXT NOT NULL,
    "server_sequence" BIGINT NOT NULL,
    "result" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sync_mutation_receipts_pkey" PRIMARY KEY ("user_id","client_mutation_id")
);

-- CreateTable
CREATE TABLE "sync_user_sequence" (
    "user_id" UUID NOT NULL,
    "last_sequence" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "sync_user_sequence_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "_LastInteractionActivity" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_LastInteractionActivity_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "account_provider_id_account_id_key" ON "account"("provider_id", "account_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_settings_user_id_key" ON "user_settings"("user_id");

-- CreateIndex
CREATE INDEX "people_user_id_idx" ON "people"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "people_groups_person_id_group_id_key" ON "people_groups"("person_id", "group_id");

-- CreateIndex
CREATE UNIQUE INDEX "people_tags_person_id_tag_id_key" ON "people_tags"("person_id", "tag_id");

-- CreateIndex
CREATE UNIQUE INDEX "people_linkedin_person_id_key" ON "people_linkedin"("person_id");

-- CreateIndex
CREATE UNIQUE INDEX "geocode_cache_place_key_key" ON "geocode_cache"("place_key");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_key_id_key" ON "api_keys"("key_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_polar_subscription_id_key" ON "subscriptions"("polar_subscription_id");

-- CreateIndex
CREATE INDEX "sync_change_log_user_id_server_sequence_idx" ON "sync_change_log"("user_id", "server_sequence");

-- CreateIndex
CREATE INDEX "_LastInteractionActivity_B_index" ON "_LastInteractionActivity"("B");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "people" ADD CONSTRAINT "people_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "people" ADD CONSTRAINT "people_last_interaction_activity_id_fkey" FOREIGN KEY ("last_interaction_activity_id") REFERENCES "interactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "people_phones" ADD CONSTRAINT "people_phones_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "people_emails" ADD CONSTRAINT "people_emails_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "people_socials" ADD CONSTRAINT "people_socials_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "people_addresses" ADD CONSTRAINT "people_addresses_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "people_important_dates" ADD CONSTRAINT "people_important_dates_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "people_relationships" ADD CONSTRAINT "people_relationships_source_person_id_fkey" FOREIGN KEY ("source_person_id") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "people_relationships" ADD CONSTRAINT "people_relationships_target_person_id_fkey" FOREIGN KEY ("target_person_id") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "people_groups" ADD CONSTRAINT "people_groups_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "people_groups" ADD CONSTRAINT "people_groups_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tags" ADD CONSTRAINT "tags_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "people_tags" ADD CONSTRAINT "people_tags_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "people_tags" ADD CONSTRAINT "people_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interaction_participants" ADD CONSTRAINT "interaction_participants_interaction_id_fkey" FOREIGN KEY ("interaction_id") REFERENCES "interactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interaction_participants" ADD CONSTRAINT "interaction_participants_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "people_linkedin" ADD CONSTRAINT "people_linkedin_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "people_work_history" ADD CONSTRAINT "people_work_history_people_linkedin_id_fkey" FOREIGN KEY ("people_linkedin_id") REFERENCES "people_linkedin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "people_education_history" ADD CONSTRAINT "people_education_history_people_linkedin_id_fkey" FOREIGN KEY ("people_linkedin_id") REFERENCES "people_linkedin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "people_merge_recommendations" ADD CONSTRAINT "people_merge_recommendations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "people_merge_recommendations" ADD CONSTRAINT "people_merge_recommendations_left_person_id_fkey" FOREIGN KEY ("left_person_id") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "people_merge_recommendations" ADD CONSTRAINT "people_merge_recommendations_right_person_id_fkey" FOREIGN KEY ("right_person_id") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "linkedin_enrich_queue" ADD CONSTRAINT "linkedin_enrich_queue_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "linkedin_enrich_queue" ADD CONSTRAINT "linkedin_enrich_queue_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "chat_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminder_dispatch_log" ADD CONSTRAINT "reminder_dispatch_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sync_change_log" ADD CONSTRAINT "sync_change_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sync_mutation_receipts" ADD CONSTRAINT "sync_mutation_receipts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sync_user_sequence" ADD CONSTRAINT "sync_user_sequence_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LastInteractionActivity" ADD CONSTRAINT "_LastInteractionActivity_A_fkey" FOREIGN KEY ("A") REFERENCES "interactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LastInteractionActivity" ADD CONSTRAINT "_LastInteractionActivity_B_fkey" FOREIGN KEY ("B") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

