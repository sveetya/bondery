import { NextResponse } from "next/server";
import { mockContacts } from "@/lib/mockData";

export async function GET() {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  const totalCount = mockContacts.filter((c) => !c.myself).length;

  return NextResponse.json({
    contacts: mockContacts,
    totalCount,
  });
}
