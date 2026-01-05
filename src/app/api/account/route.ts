"use server";

import { NextResponse } from "next/server";
import { verifyAuthentication } from "@/lib/api/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    // Verify user authentication
    const auth = await verifyAuthentication();

    // If auth is NextResponse (error), return it directly
    if (auth instanceof NextResponse) {
      return auth;
    }

    // Get user data from Supabase
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json(
        { error: "Failed to retrieve user data" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: user,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    // Verify user authentication
    const auth = await verifyAuthentication();

    // If auth is NextResponse (error), return it directly
    if (auth instanceof NextResponse) {
      return auth;
    }

    const body = await request.json();
    const { name, middlename, surname } = body;

    // Update user metadata
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.updateUser({
      data: {
        name,
        middlename,
        surname,
      },
    });

    if (error) {
      console.error("Error updating user:", error);
      return NextResponse.json(
        { error: "Failed to update account" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: data.user,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    // Verify user authentication
    const auth = await verifyAuthentication();

    // If auth is NextResponse (error), return it directly
    if (auth instanceof NextResponse) {
      return auth;
    }

    // Delete the user using Supabase
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.admin.deleteUser(auth.id);

    if (error) {
      console.error("Error deleting user:", error);
      return NextResponse.json(
        { error: "Failed to delete account" },
        { status: 500 }
      );
    }

    return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_URL));
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error", description: String(error) },
      { status: 500 }
    );
  }
}
