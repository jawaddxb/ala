import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getTopics, createTopic, getCategories } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const topics = getTopics();
  const categories = getCategories();
  return NextResponse.json({ topics, categories });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await req.json();
    const id = `topic-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const success = createTopic({
      id,
      name: data.name,
      category: data.category,
      status: data.status || "active",
      stance_summary: data.stance_summary || null,
      deflection_message: data.deflection_message || null,
    });

    if (success) {
      return NextResponse.json({ message: "Created", id });
    }
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
