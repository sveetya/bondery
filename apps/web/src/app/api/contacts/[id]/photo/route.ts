"use server";

import { NextResponse } from "next/server";
import { verifyAuthentication } from "@/lib/api/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { validateImageUpload } from "@/lib/imageValidation";

/**
 * Upload a photo for a specific contact
 * POST /api/contacts/[id]/photo
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contactId } = await params;

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

    // Verify contact belongs to user
    const { data: contact, error: contactError } = await supabase
      .from("contacts")
      .select("id")
      .eq("id", contactId)
      .eq("user_id", auth.id)
      .single();

    if (contactError || !contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    // Delete existing contact photo if it exists
    const { data: existingContact } = await supabase
      .from("contacts")
      .select("avatar")
      .eq("id", contactId)
      .single();

    if (existingContact?.avatar) {
      const oldFileName = existingContact.avatar.split("/").pop();
      if (oldFileName) {
        await supabase.storage
          .from("avatars")
          .remove([`${auth.id}/${oldFileName}`]);
      }
    }

    // Upload new photo to storage: userId/contactId.jpg
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileName = `${auth.id}/${contactId}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("Error uploading photo:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload photo" },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(fileName);

    if (!urlData?.publicUrl) {
      return NextResponse.json(
        { error: "Failed to get photo URL" },
        { status: 500 }
      );
    }

    // Add cache-busting parameter to URL to force refresh
    const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    // Update contact record with new avatar URL
    const { error: updateError } = await supabase
      .from("contacts")
      .update({ avatar: avatarUrl })
      .eq("id", contactId);

    if (updateError) {
      console.error("Error updating contact:", updateError);
      return NextResponse.json(
        { error: "Failed to update contact" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      avatarUrl: avatarUrl,
    });
  } catch (error) {
    console.error("Error in contact photo upload:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
