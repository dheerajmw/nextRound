import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api/auth";
import { linkPendingInvites } from "@/lib/partners/access";

export async function POST() {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  try {
    const linked = await linkPendingInvites(auth.user.id);
    return NextResponse.json({ linked });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to accept invites";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
