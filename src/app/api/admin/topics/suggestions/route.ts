import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getTopicSuggestions } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const suggestions = getTopicSuggestions();
  return NextResponse.json({ suggestions });
}
