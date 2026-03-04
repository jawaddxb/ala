import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { updateTopicSuggestion } from "@/lib/db";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const data = await req.json();
    const success = updateTopicSuggestion(id, data.status, data.admin_notes);
    if (success) {
      return NextResponse.json({ message: "Updated" });
    }
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
