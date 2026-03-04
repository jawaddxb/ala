import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getThesisEntries, createThesisEntry, getCategories } from "@/lib/db";

export async function GET(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") || undefined;

  const entries = getThesisEntries(category);
  const categories = getCategories();
  return NextResponse.json({ entries, categories });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await req.json();
    const id = `thesis-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const success = createThesisEntry({
      id,
      category: data.category,
      title: data.title,
      stance: data.stance,
      confidence: data.confidence || "firm",
      supporting_sources: data.supporting_sources || null,
      is_active: data.is_active ?? 1,
      sort_order: data.sort_order ?? 0,
    });

    if (success) {
      return NextResponse.json({ message: "Created", id });
    }
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
