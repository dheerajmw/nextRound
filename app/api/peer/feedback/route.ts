import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/api/auth";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";

const schema = z.object({
  peer_session_id: z.string().uuid(),
  to_user_id: z.string().uuid(),
  ratings: z.object({
    communication: z.number().int().min(1).max(5),
    structure: z.number().int().min(1).max(5),
    helpfulness: z.number().int().min(1).max(5),
  }),
  comment: z.string().max(2000).optional(),
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
    return NextResponse.json({ error: "Invalid feedback" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: peerRaw } = await supabase
    .from("peer_sessions")
    .select("host_user_id, partner_user_id, status")
    .eq("id", parsed.data.peer_session_id)
    .single();

  const peer = peerRaw as {
    host_user_id: string;
    partner_user_id: string | null;
    status: string;
  } | null;

  if (!peer) {
    return NextResponse.json({ error: "Peer session not found" }, { status: 404 });
  }

  const participants = [peer.host_user_id, peer.partner_user_id].filter(
    (id): id is string => Boolean(id)
  );
  if (
    !participants.includes(auth.user.id) ||
    !participants.includes(parsed.data.to_user_id)
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("peer_feedback")
    .upsert(
      {
        peer_session_id: parsed.data.peer_session_id,
        from_user_id: auth.user.id,
        to_user_id: parsed.data.to_user_id,
        ratings: parsed.data.ratings as Json,
        comment: parsed.data.comment ?? null,
      },
      { onConflict: "peer_session_id,from_user_id" }
    )
    .select("id, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ feedback: data });
}
