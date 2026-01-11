import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

interface User {
  id: string;
  email: string;
  name: string;
}

/**
 * Verifies user authentication using Supabase
 * Checks the current session and returns user data if authenticated
 *
 * @returns NextResponse with error (401) or User object if authenticated
 */
export async function verifyAuthentication(
  request?: NextRequest
): Promise<NextResponse | User> {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    console.error("Authentication failed:", error);
    return NextResponse.json(
      { error: "Unauthorized - Please log in" },
      { status: 401 }
    );
  }

  // Return user data from Supabase
  return {
    id: user.id,
    email: user.email || "",
    name: user.user_metadata?.name || user.email || "User",
  };
}
