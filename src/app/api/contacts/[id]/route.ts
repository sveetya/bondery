import { NextResponse } from "next/server";
import { mockContacts } from "@/lib/mockData";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  const contact = mockContacts.find((c) => c.id === id);

  if (!contact) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }

  return NextResponse.json({ contact });
}
