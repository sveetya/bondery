import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createServerSupabaseClient();

  const { data: contacts, error } = await supabase
    .from("contacts")
    .select(
      `
      id,
      firstName:first_name,
      middleName:middle_name,
      lastName:last_name,
      title,
      place,
      description,
      notes,
      avatarColor:avatar_color,
      avatar,
      lastInteraction:last_interaction,
      createdAt:created_at,
      connections,
      phone,
      email,
      linkedin,
      instagram,
      whatsapp,
      facebook,
      website,
      signal,
      birthdate,
      notifyBirthday:notify_birthday,
      importantDates:important_dates,
      myself,
      position
    `
    )
    .eq("myself", false);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const totalCount = contacts.length;

  return NextResponse.json({
    contacts,
    totalCount,
  });
}

export async function DELETE(request: Request) {
  const supabase = await createServerSupabaseClient();

  try {
    const { ids } = await request.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "Invalid request body. 'ids' must be a non-empty array." },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("contacts").delete().in("id", ids);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Contacts deleted successfully" });
  } catch (err) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();

  try {
    const body = await request.json();

    // Validation
    if (!body.firstName || body.firstName.trim().length === 0) {
      return NextResponse.json(
        { error: "First name is required" },
        { status: 400 }
      );
    }

    if (!body.lastName || body.lastName.trim().length === 0) {
      return NextResponse.json(
        { error: "Last name is required" },
        { status: 400 }
      );
    }

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Prepare insert data
    const insertData: any = {
      user_id: user.id,
      first_name: body.firstName.trim(),
      last_name: body.lastName.trim(),
      description: "",
      avatar_color: "blue",
      last_interaction: new Date().toISOString(),
      myself: false,
    };

    // Add optional fields
    if (body.linkedin) {
      insertData.linkedin = body.linkedin.trim();
    }

    // Insert contact
    const { data: newContact, error } = await supabase
      .from("contacts")
      .insert(insertData)
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ id: newContact.id }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}
