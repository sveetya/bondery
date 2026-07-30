-- Add idempotency constraint for per-user daily reminder dispatch logs.
CREATE UNIQUE INDEX IF NOT EXISTS "reminder_dispatch_log_user_id_reminder_date_key"
ON "reminder_dispatch_log"("user_id", "reminder_date");
