import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getSourceById, updateSource, deleteSource, createSource } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const source = getSourceById(id);
  
  if (!source) {
    return NextResponse.json({ error: "Source not found" }, { status: 404 });
  }

  return NextResponse.json(source);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const data = await req.json();
    
    const success = updateSource(id, data);
    
    if (success) {
      return NextResponse.json({ message: "Source updated" });
    } else {
      return NextResponse.json({ error: "Source not found" }, { status: 404 });
    }
  } catch (error) {
    console.error("Update source error:", error);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id: rawId } = await params;
    const data = await req.json();
    
    // Generate proper ID if it's a new source
    const id = rawId.startsWith("new_") 
      ? `${data.source}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      : rawId;

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

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const success = deleteSource(id);
  
  if (success) {
    return NextResponse.json({ message: "Source deleted" });
  } else {
    return NextResponse.json({ error: "Source not found" }, { status: 404 });
  }
}
