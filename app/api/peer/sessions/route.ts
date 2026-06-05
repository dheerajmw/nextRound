import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/api/auth";
import { createPeerSession } from "@/lib/vision/peer-sessions";
import { createClient } from "@/lib/supabase/server";

const createSchema = z.object({
  mode: z.enum(["behavioral", "hr", "pm", "technical"]).default("behavioral"),
  target_role: z.string().max(120).optional(),
});

export async function GET() {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const supabase = await createClient();
  const { data } = await supabase
    .from("peer_sessions")
    .select(
      "id, join_code, status, mode, target_role, host_user_id, partner_user_id, host_session_id, partner_session_id, created_at"
    )
    .or(
      `host_user_id.eq.${auth.user.id},partner_user_id.eq.${auth.user.id}`
    )
    .order("created_at", { ascending: false })
    .limit(20);

  return NextResponse.json({ sessions: data ?? [] });
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const session = await createPeerSession({
      hostUserId: auth.user.id,
      mode: parsed.data.mode,
      targetRole: parsed.data.target_role,
    });
    return NextResponse.json({ session });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
