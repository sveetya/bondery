-- Batched changelog rows share one server_sequence and differ by change_index.
-- 0_init keyed only on server_sequence, so the second row in a batch failed
-- after CRM writes (Bondery JSON import). Production/legacy already uses this
-- composite primary key; skip when the constraint is already correct.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.sync_change_log'::regclass
      AND conname = 'sync_change_log_pkey'
      AND array_length(conkey, 1) = 1
  ) THEN
    ALTER TABLE "sync_change_log" DROP CONSTRAINT "sync_change_log_pkey";
    ALTER TABLE "sync_change_log"
    ADD CONSTRAINT "sync_change_log_pkey"
    PRIMARY KEY ("user_id", "server_sequence", "change_index");
  END IF;
END $$;
