import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getKnowledgeDocs, createKnowledgeDoc, getCategories } from "@/lib/db";

export async function GET(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") || undefined;

  const docs = getKnowledgeDocs({ category });
  const categories = getCategories();
  return NextResponse.json({ docs, categories });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await req.json();
    const id = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const success = createKnowledgeDoc({
      id,
      title: data.title,
      content: data.content,
      doc_type: data.doc_type || "article",
      category: data.category || null,
      is_approved: data.is_approved ?? 1,
    });

    if (success) {
      return NextResponse.json({ message: "Created", id });
    }
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
