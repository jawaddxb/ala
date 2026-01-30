import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { bulkImportSources } from "@/lib/db";

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { sources } = await req.json();

    if (!Array.isArray(sources)) {
      return NextResponse.json({ error: "Sources must be an array" }, { status: 400 });
    }

    // Validate required fields
    for (const source of sources) {
      if (!source.id || !source.reference || !source.text || !source.source) {
        return NextResponse.json(
          { error: "Each source must have id, reference, text, and source fields" },
          { status: 400 }
        );
      }
    }

    const result = bulkImportSources(sources);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
