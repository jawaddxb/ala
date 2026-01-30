import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getSources, createSource } from "@/lib/db";

export async function GET(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const source = searchParams.get("source") || undefined;
  const search = searchParams.get("search") || undefined;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  const result = getSources({ source, search, page, limit });
  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await req.json();
    
    // Generate ID if it's a new source
    const id = data.id?.startsWith("new_") 
      ? `${data.source}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      : data.id;

    const success = createSource({
      ...data,
      id,
    });

    if (success) {
      return NextResponse.json({ message: "Source created", id });
    } else {
      return NextResponse.json({ error: "Failed to create source" }, { status: 500 });
    }
  } catch (error) {
    console.error("Create source error:", error);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
