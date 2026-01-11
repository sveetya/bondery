import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { validateImageUpload } from "@/lib/imageValidation";

interface ProfileData {
  instagram: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  profileImageUrl?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ProfileData = await request.json();
    const { instagram, firstName, middleName, lastName, profileImageUrl } =
      body;

    if (!instagram) {
      return NextResponse.json(
        { error: "Instagram username is required" },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Look up contact by Instagram username
    const { data: existingContact, error: lookupError } = await supabase
      .from("contacts")
      .select("id, avatar")
      .eq("user_id", user.id)
      .eq("instagram", instagram)
      .single();

    if (lookupError && lookupError.code !== "PGRST116") {
      console.error("Error looking up contact:", lookupError);
      return NextResponse.json(
        { error: "Failed to look up contact" },
        { status: 500 }
      );
    }

    // If contact exists
    if (existingContact) {
      // Update profile photo if provided and contact doesn't have one
      if (profileImageUrl && !existingContact.avatar) {
        await updateContactPhoto(
          supabase,
          existingContact.id,
          user.id,
          profileImageUrl
        );
      }

      return NextResponse.json({
        contactId: existingContact.id,
        existed: true,
      });
    }

    // Contact doesn't exist, create a new one
    const insertData: {
      user_id: string;
      instagram: string;
      first_name: string;
      middle_name?: string;
      last_name?: string;
      created_at: string;
      updated_at: string;
    } = {
      user_id: user.id,
      instagram: instagram,
      first_name: firstName || instagram,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (middleName) insertData.middle_name = middleName;
    if (lastName) insertData.last_name = lastName;

    const { data: newContact, error: createError } = await supabase
      .from("contacts")
      .insert(insertData)
      .select("id")
      .single();

    if (createError || !newContact) {
      console.error("Error creating contact:", createError);
      return NextResponse.json(
        { error: "Failed to create contact" },
        { status: 500 }
      );
    }

    // Upload profile photo if provided
    if (profileImageUrl) {
      await updateContactPhoto(
        supabase,
        newContact.id,
        user.id,
        profileImageUrl
      );
    }

    return NextResponse.json({
      contactId: newContact.id,
      existed: false,
    });
  } catch (error) {
    console.error("Unexpected error in /api/redirect POST:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function updateContactPhoto(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  contactId: string,
  userId: string,
  imageUrl: string
) {
  try {
    // Fetch the image
    const response = await fetch(imageUrl);
    if (!response.ok) return;

    const blob = await response.blob();

    // Validate file type and size
    const validation = validateImageUpload({
      type: blob.type,
      size: blob.size,
    });
    if (!validation.isValid) {
      console.error("Image validation failed:", validation.error);
      return;
    }

    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase storage: userId/contactId.jpg
    const fileName = `${userId}/${contactId}.jpg`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, buffer, {
        contentType: blob.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("Error uploading photo:", uploadError);
      return;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(fileName);

    if (urlData?.publicUrl) {
      // Update contact with avatar URL
      await supabase
        .from("contacts")
        .update({ avatar: urlData.publicUrl })
        .eq("id", contactId);
    }
  } catch (error) {
    console.error("Error in updateContactPhoto:", error);
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const instagramUsername = searchParams.get("instagram");
  const firstName = searchParams.get("firstName");
  const middleName = searchParams.get("middleName");
  const lastName = searchParams.get("lastName");
  const profileImageUrl = searchParams.get("profileImageUrl");

  if (!instagramUsername) {
    return NextResponse.json(
      { error: "Instagram username is required" },
      { status: 400 }
    );
  }

  try {
    const supabase = await createServerSupabaseClient();

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      // Redirect to login with return URL
      const returnUrl = `/api/redirect?${searchParams.toString()}`;
      return NextResponse.redirect(
        new URL(
          `/login?returnUrl=${encodeURIComponent(returnUrl)}`,
          request.url
        )
      );
    }

    // Look up contact by Instagram username
    const { data: existingContact, error: lookupError } = await supabase
      .from("contacts")
      .select("id, avatar")
      .eq("user_id", user.id)
      .eq("instagram", instagramUsername)
      .single();

    if (lookupError && lookupError.code !== "PGRST116") {
      // PGRST116 is "no rows found", which is fine
      console.error("Error looking up contact:", lookupError);
      return NextResponse.json(
        { error: "Failed to look up contact" },
        { status: 500 }
      );
    }

    // If contact exists
    if (existingContact) {
      // Update profile photo if provided and contact doesn't have one
      if (profileImageUrl && !existingContact.avatar) {
        await updateContactPhoto(
          supabase,
          existingContact.id,
          user.id,
          profileImageUrl
        );
      }

      return NextResponse.redirect(
        new URL(`/app/person?person_id=${existingContact.id}`, request.url)
      );
    }

    // Contact doesn't exist, create a new one
    const insertData: {
      user_id: string;
      instagram: string;
      first_name: string;
      middle_name?: string;
      last_name?: string;
      created_at: string;
      updated_at: string;
    } = {
      user_id: user.id,
      instagram: instagramUsername,
      first_name: firstName || instagramUsername,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (middleName) insertData.middle_name = middleName;
    if (lastName) insertData.last_name = lastName;

    const { data: newContact, error: createError } = await supabase
      .from("contacts")
      .insert(insertData)
      .select("id")
      .single();

    if (createError || !newContact) {
      console.error("Error creating contact:", createError);
      return NextResponse.json(
        { error: "Failed to create contact" },
        { status: 500 }
      );
    }

    // Upload profile photo if provided
    if (profileImageUrl) {
      await updateContactPhoto(
        supabase,
        newContact.id,
        user.id,
        profileImageUrl
      );
    }

    // Redirect to the newly created contact's page
    return NextResponse.redirect(
      new URL(`/app/person?person_id=${newContact.id}`, request.url)
    );
  } catch (error) {
    console.error("Unexpected error in /api/redirect:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
