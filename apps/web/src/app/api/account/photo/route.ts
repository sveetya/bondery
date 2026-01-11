"use server";

import { NextResponse } from "next/server";
import { verifyAuthentication } from "@/lib/api/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { validateImageUpload } from "@/lib/imageValidation";

export async function POST(request: Request) {
  try {
    // Verify user authentication
    const auth = await verifyAuthentication();

    if (auth instanceof NextResponse) {
      return auth;
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type and size
    const validation = validateImageUpload(file);
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();

    // Delete existing profile photo if it exists
    const { data: existingFiles } = await supabase.storage
      .from("profile-photos")
      .list(auth.id);

    if (existingFiles && existingFiles.length > 0) {
      const filesToDelete = existingFiles.map((f) => `${auth.id}/${f.name}`);
      await supabase.storage.from("profile-photos").remove(filesToDelete);
    }

    // Upload new file
    const fileExt = file.name.split(".").pop();
    const fileName = `${auth.id}/profile.${fileExt}`;
    const fileBuffer = await file.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from("profile-photos")
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload profile photo" },
        { status: 500 }
      );
    }

    // Get public URL for the uploaded file
    const { data: publicUrlData } = supabase.storage
      .from("profile-photos")
      .getPublicUrl(fileName);

    // Add timestamp to force cache invalidation when photo changes
    const avatarUrl = publicUrlData?.publicUrl
      ? `${publicUrlData.publicUrl}?t=${Date.now()}`
      : null;

    console.log("Generated public URL:", avatarUrl);

    if (!avatarUrl) {
      console.error("Failed to generate public URL");
      return NextResponse.json(
        { error: "Failed to generate avatar URL" },
        { status: 500 }
      );
    }

    // Store the public URL in user_settings table
    const { error: updateError } = await supabase.from("user_settings").upsert(
      {
        user_id: auth.id,
        avatar_url: avatarUrl,
      },
      {
        onConflict: "user_id",
      }
    );

    console.log("Updated user_settings with avatar_url:", avatarUrl);

    if (updateError) {
      console.error("Error updating user metadata:", updateError);
      return NextResponse.json(
        { error: "Failed to update user profile" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          avatarUrl: avatarUrl,
        },
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

    if (auth instanceof NextResponse) {
      return auth;
    }

    const supabase = await createServerSupabaseClient();

    // Delete all files in user's folder
    const { data: files } = await supabase.storage
      .from("profile-photos")
      .list(auth.id);

    if (files && files.length > 0) {
      const filesToDelete = files.map((f) => `${auth.id}/${f.name}`);
      const { error: deleteError } = await supabase.storage
        .from("profile-photos")
        .remove(filesToDelete);

      if (deleteError) {
        console.error("Delete error:", deleteError);
        return NextResponse.json(
          { error: "Failed to delete profile photo" },
          { status: 500 }
        );
      }
    }

    // Remove avatar URL from user settings
    const { error: updateError } = await supabase
      .from("user_settings")
      .update({ avatar_url: null })
      .eq("user_id", auth.id);

    if (updateError) {
      console.error("Error updating user settings:", updateError);
      return NextResponse.json(
        { error: "Failed to update user profile" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
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
