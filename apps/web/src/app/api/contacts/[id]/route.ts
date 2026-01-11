import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = await createServerSupabaseClient();

  const { data: contact, error } = await supabase
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
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json({ contact });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = await createServerSupabaseClient();

  try {
    const body = await request.json();

    // Map camelCase to snake_case
    const updates: any = {};
    if (body.firstName !== undefined) {
      if (!body.firstName || body.firstName.trim().length === 0) {
        return NextResponse.json(
          { error: "First name is required" },
          { status: 400 }
        );
      }
      updates.first_name = body.firstName;
    }
    if (body.middleName !== undefined) updates.middle_name = body.middleName;
    if (body.lastName !== undefined) updates.last_name = body.lastName;
    if (body.title !== undefined) updates.title = body.title;
    if (body.place !== undefined) updates.place = body.place;
    if (body.description !== undefined) updates.description = body.description;
    if (body.notes !== undefined) updates.notes = body.notes;
    if (body.avatarColor !== undefined) updates.avatar_color = body.avatarColor;
    if (body.avatar !== undefined) updates.avatar = body.avatar;
    if (body.connections !== undefined) updates.connections = body.connections;
    if (body.phone !== undefined) updates.phone = body.phone;
    if (body.email !== undefined) updates.email = body.email;
    if (body.linkedin !== undefined) updates.linkedin = body.linkedin;
    if (body.instagram !== undefined) updates.instagram = body.instagram;
    if (body.whatsapp !== undefined) updates.whatsapp = body.whatsapp;
    if (body.facebook !== undefined) updates.facebook = body.facebook;
    if (body.website !== undefined) updates.website = body.website;
    if (body.signal !== undefined) updates.signal = body.signal;
    if (body.birthdate !== undefined) updates.birthdate = body.birthdate;
    if (body.notifyBirthday !== undefined)
      updates.notify_birthday = body.notifyBirthday;
    if (body.importantDates !== undefined)
      updates.important_dates = body.importantDates;
    if (body.position !== undefined) updates.position = body.position;

    updates.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from("contacts")
      .update(updates)
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Contact updated successfully" });
  } catch (err) {
    return NextResponse.json({ error: "Invalid Request" }, { status: 400 });
  }
}
