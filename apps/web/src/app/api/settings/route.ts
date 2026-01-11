import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user settings from database
    const { data: settings, error } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "no rows returned"
      console.error("Error fetching settings:", error);
      return NextResponse.json(
        { error: "Failed to fetch settings" },
        { status: 500 }
      );
    }

    // If no settings exist, return defaults
    if (!settings) {
      return NextResponse.json({
        success: true,
        data: {
          user_id: user.id,
          name: "",
          middlename: "",
          surname: "",
          timezone: "UTC",
          language: "en",
          email: user.email,
          avatar_url: user.user_metadata?.avatar_url || null,
          providers: user.app_metadata?.providers || [],
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...settings,
        email: user.email,
        avatar_url:
          settings.avatar_url || user.user_metadata?.avatar_url || null,
        providers: user.app_metadata?.providers || [],
      },
    });
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
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, middlename, surname, timezone, language } = body;

    // Check if settings exist
    const { data: existingSettings } = await supabase
      .from("user_settings")
      .select("id")
      .eq("user_id", user.id)
      .single();

    let result;

    if (existingSettings) {
      // Update existing settings
      const { data, error } = await supabase
        .from("user_settings")
        .update({
          name,
          middlename,
          surname,
          timezone,
          language,
        })
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) {
        console.error("Error updating settings:", error);
        return NextResponse.json(
          { error: "Failed to update settings" },
          { status: 500 }
        );
      }

      result = data;
    } else {
      // Insert new settings
      const { data, error } = await supabase
        .from("user_settings")
        .insert({
          user_id: user.id,
          name,
          middlename,
          surname,
          timezone,
          language,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating settings:", error);
        return NextResponse.json(
          { error: "Failed to create settings" },
          { status: 500 }
        );
      }

      result = data;
    }

    // Sync display_name in auth.users table using the updated values
    const displayName = [result.name, result.middlename, result.surname]
      .filter(Boolean)
      .join(" ")
      .trim();

    if (displayName) {
      const { error: updateAuthError } = await supabase.auth.updateUser({
        data: {
          name: displayName,
        },
      });

      if (updateAuthError) {
        console.error("Error updating auth name:", updateAuthError);
        // Don't fail the request if name update fails
      }
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
