import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/api/auth";
import { hasLlmKeys } from "@/lib/env";
import {
  getOrCreateCoachThread,
  sendCoachMessage,
} from "@/lib/vision/coach";
import { createClient } from "@/lib/supabase/server";

const messageSchema = z.object({
  message: z.string().min(2).max(4000),
  thread_id: z.string().uuid().optional(),
});

export async function GET() {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const threadId = await getOrCreateCoachThread(auth.user.id);
  const supabase = await createClient();

  const { data: messages } = await supabase
    .from("coach_messages")
    .select("id, role, content, created_at")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true })
    .limit(50);

  const { data: memories } = await supabase
    .from("coach_memory")
    .select("memory_key, memory_value, updated_at")
    .eq("user_id", auth.user.id)
    .order("updated_at", { ascending: false })
    .limit(10);

  return NextResponse.json({
    thread_id: threadId,
    messages: messages ?? [],
    memories: memories ?? [],
  });
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  if (!hasLlmKeys()) {
    return NextResponse.json({ error: "LLM not configured" }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = messageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid message" }, { status: 400 });
  }

  try {
    const threadId =
      parsed.data.thread_id ?? (await getOrCreateCoachThread(auth.user.id));
    const result = await sendCoachMessage({
      userId: auth.user.id,
      threadId,
      message: parsed.data.message,
    });
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message.includes("valid JSON") ||
          error.message.includes("Unexpected token")
          ? "Coach could not read the model response. Please try again."
          : error.message
        : "Coach request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
