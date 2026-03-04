import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getVoiceProfile, updateVoiceProfile } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = getVoiceProfile();
  return NextResponse.json(profile);
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await req.json();
    const success = updateVoiceProfile(data);
    if (success) {
      return NextResponse.json({ message: "Updated" });
    }
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
