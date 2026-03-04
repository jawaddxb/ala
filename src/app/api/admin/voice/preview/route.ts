import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { question } = await req.json();
    if (!question) {
      return NextResponse.json({ error: "Missing question" }, { status: 400 });
    }

    // Forward to the main chat API to test the voice
    const chatResponse = await fetch(new URL("/api/chat", req.url).toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: question }],
      }),
    });

    const text = await chatResponse.text();
    return NextResponse.json({ response: text });
  } catch {
    return NextResponse.json({ error: "Preview failed" }, { status: 500 });
  }
}
