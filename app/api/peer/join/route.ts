import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/api/auth";
import { joinPeerSession } from "@/lib/vision/peer-sessions";

const schema = z.object({
  join_code: z.string().min(4).max(10),
});

export async function POST(request: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid join code" }, { status: 400 });
  }

  try {
    const session = await joinPeerSession({
      joinCode: parsed.data.join_code,
      partnerUserId: auth.user.id,
    });

    if (!session) {
      return NextResponse.json(
        { error: "Session not found or already full" },
        { status: 404 }
      );
    }

    return NextResponse.json({ session });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Join failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
