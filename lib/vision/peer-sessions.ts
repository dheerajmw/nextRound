import type { PeerSessionDto } from "@/lib/vision/types";
import { createClient } from "@/lib/supabase/server";

function generateJoinCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function createPeerSession(params: {
  hostUserId: string;
  mode: "behavioral" | "hr" | "pm" | "technical";
  targetRole?: string;
}): Promise<PeerSessionDto> {
  const supabase = await createClient();
  let code = generateJoinCode();
  let attempts = 0;

  while (attempts < 5) {
    const { data, error } = await supabase
      .from("peer_sessions")
      .insert({
        host_user_id: params.hostUserId,
        join_code: code,
        mode: params.mode,
        target_role: params.targetRole ?? null,
        status: "open",
      })
      .select(
        "id, join_code, status, mode, target_role, host_user_id, partner_user_id, host_session_id, partner_session_id, created_at"
      )
      .single();

    if (!error && data) return data as PeerSessionDto;
    if (error?.code !== "23505") throw new Error(error?.message ?? "Failed");
    code = generateJoinCode();
    attempts += 1;
  }

  throw new Error("Failed to generate unique join code");
}

export async function joinPeerSession(params: {
  joinCode: string;
  partnerUserId: string;
}): Promise<PeerSessionDto | null> {
  const supabase = await createClient();
  const code = params.joinCode.trim().toUpperCase();

  const { data: session } = await supabase
    .from("peer_sessions")
    .select(
      "id, join_code, status, mode, target_role, host_user_id, partner_user_id, host_session_id, partner_session_id, created_at"
    )
    .eq("join_code", code)
    .eq("status", "open")
    .maybeSingle();

  if (!session) return null;
  if (session.host_user_id === params.partnerUserId) {
    throw new Error("Cannot join your own session");
  }

  const { data: updated, error } = await supabase
    .from("peer_sessions")
    .update({
      partner_user_id: params.partnerUserId,
      status: "active",
    })
    .eq("id", session.id)
    .select(
      "id, join_code, status, mode, target_role, host_user_id, partner_user_id, host_session_id, partner_session_id, created_at"
    )
    .single();

  if (error || !updated) throw new Error(error?.message ?? "Join failed");
  return updated as PeerSessionDto;
}

export async function linkInterviewToPeerSession(params: {
  peerSessionId: string;
  userId: string;
  interviewSessionId: string;
}): Promise<void> {
  const supabase = await createClient();
  const { data: peer } = await supabase
    .from("peer_sessions")
    .select("host_user_id, partner_user_id, host_session_id, partner_session_id")
    .eq("id", params.peerSessionId)
    .single();

  if (!peer) throw new Error("Peer session not found");

  if (peer.host_user_id === params.userId && !peer.host_session_id) {
    await supabase
      .from("peer_sessions")
      .update({ host_session_id: params.interviewSessionId })
      .eq("id", params.peerSessionId);
  } else if (
    peer.partner_user_id === params.userId &&
    !peer.partner_session_id
  ) {
    await supabase
      .from("peer_sessions")
      .update({ partner_session_id: params.interviewSessionId })
      .eq("id", params.peerSessionId);
  } else {
    throw new Error("Not a participant or session already linked");
  }

  const { data: refreshed } = await supabase
    .from("peer_sessions")
    .select("host_session_id, partner_session_id")
    .eq("id", params.peerSessionId)
    .single();

  if (refreshed?.host_session_id && refreshed?.partner_session_id) {
    await supabase
      .from("peer_sessions")
      .update({ status: "completed" })
      .eq("id", params.peerSessionId);
  }
}
