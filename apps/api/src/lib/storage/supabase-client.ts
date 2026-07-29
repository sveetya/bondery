/**
 * Supabase Storage / PostgREST clients (no auth session handling).
 */

import type { Database } from "@bondery/schemas/supabase.types";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function getSupabaseConfig() {
  const BONDERY_PUBLIC_SUPABASE_URL = process.env.BONDERY_PUBLIC_SUPABASE_URL;
  const BONDERY_PUBLIC_SUPABASE_PUBLISHABLE_KEY =
    process.env.BONDERY_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const BONDERY_PRIVATE_SUPABASE_SECRET_KEY = process.env.BONDERY_PRIVATE_SUPABASE_SECRET_KEY;
  const clientBaseUrl =
    process.env.BONDERY_INFRA_INTERNAL_SUPABASE_URL?.trim() || BONDERY_PUBLIC_SUPABASE_URL;

  if (!BONDERY_PUBLIC_SUPABASE_URL) {
    throw new Error(
      "Missing required Supabase environment variables. " +
        "Ensure BONDERY_PUBLIC_SUPABASE_URL, BONDERY_PUBLIC_SUPABASE_PUBLISHABLE_KEY, and BONDERY_PRIVATE_SUPABASE_SECRET_KEY are set.",
    );
  }
  if (!BONDERY_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    throw new Error("Missing BONDERY_PUBLIC_SUPABASE_PUBLISHABLE_KEY environment variable.");
  }
  if (!BONDERY_PRIVATE_SUPABASE_SECRET_KEY) {
    throw new Error("Missing BONDERY_PRIVATE_SUPABASE_SECRET_KEY environment variable.");
  }

  return {
    BONDERY_PRIVATE_SUPABASE_SECRET_KEY,
    BONDERY_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    clientBaseUrl: clientBaseUrl as string,
  };
}

/** Anonymous client for public storage URLs and unscoped PostgREST reads. */
export function createAnonClient(): SupabaseClient<Database> {
  const { clientBaseUrl, BONDERY_PUBLIC_SUPABASE_PUBLISHABLE_KEY } = getSupabaseConfig();
  return createClient<Database>(clientBaseUrl, BONDERY_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

/** Service-role client for storage mutations and admin operations. */
export function createAdminClient(): SupabaseClient<Database> {
  const { clientBaseUrl, BONDERY_PRIVATE_SUPABASE_SECRET_KEY } = getSupabaseConfig();
  return createClient<Database>(clientBaseUrl, BONDERY_PRIVATE_SUPABASE_SECRET_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
