"use server";

import { NextResponse } from "next/server";
import { verifyAuthentication } from "@/lib/api/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getBaseUrl } from "@/lib/config";

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

    // Get user settings from database
    const { data: settings } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", user.id)
      .single();

    // Return user data with settings (avatar_url comes from user_settings, fallback to user_metadata)
    const userData = {
      ...user,
      user_metadata: {
        ...user.user_metadata,
        // Override with settings if available
        name: settings?.name || user.user_metadata?.name || "",
        middlename:
          settings?.middlename || user.user_metadata?.middlename || "",
        surname: settings?.surname || user.user_metadata?.surname || "",
        avatar_url:
          settings?.avatar_url || user.user_metadata?.avatar_url || null,
      },
    };

    return NextResponse.json(
      {
        success: true,
        data: userData,
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

    const supabase = await createServerSupabaseClient();

    // Delete all storage objects owned by the user before deleting the user account
    // This prevents the "user owns storage objects" error
    try {
      // List all files in the user's profile-photos folder
      const { data: files, error: listError } = await supabase.storage
        .from("profile-photos")
        .list(auth.id);

      if (listError) {
        console.error("Error listing user files:", listError);
      }

      // If there are files, delete them
      if (files && files.length > 0) {
        const filePaths = files.map((file) => `${auth.id}/${file.name}`);
        const { error: deleteFilesError } = await supabase.storage
          .from("profile-photos")
          .remove(filePaths);

        if (deleteFilesError) {
          console.error("Error deleting user files:", deleteFilesError);
          return NextResponse.json(
            { error: "Failed to delete user files before account deletion" },
            { status: 500 }
          );
        }
      }
    } catch (storageError) {
      console.error("Error during storage cleanup:", storageError);
      // Continue with user deletion even if storage cleanup fails
    }

    // Delete the user using Supabase
    const { error } = await supabase.auth.admin.deleteUser(auth.id);

    if (error) {
      console.error("Error deleting user:", error);
      return NextResponse.json(
        { error: "Failed to delete account" },
        { status: 500 }
      );
    }

    return NextResponse.redirect(new URL("/", getBaseUrl()));
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error", description: String(error) },
      { status: 500 }
    );
  }
}
