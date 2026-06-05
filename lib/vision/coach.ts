import { z } from "zod";
import { buildCoachChatPrompt } from "@/prompts/v1/coach-chat";
import { completeWithFallback } from "@/lib/llm/client";
import { extractJsonObject } from "@/lib/interview/parse-json";
import { computeReadinessIndex } from "@/lib/readiness/compute";
import type { EvaluationScores } from "@/lib/evaluation/types";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";

const coachSchema = z.object({
  reply: z.string().min(10),
  memory_updates: z
    .array(
      z.object({
        key: z.string().min(2).max(64),
        value: z.string().min(3),
      })
    )
    .max(3)
    .optional()
    .default([]),
});

export async function sendCoachMessage(params: {
  userId: string;
  threadId: string;
  message: string;
}): Promise<{ reply: string; threadId: string }> {
  const supabase = await createClient();

  const { data: thread } = await supabase
    .from("coach_threads")
    .select("id, user_id")
    .eq("id", params.threadId)
    .eq("user_id", params.userId)
    .single();

  if (!thread) throw new Error("Thread not found");

  const { data: profile } = await supabase
    .from("profiles")
    .select("target_role")
    .eq("user_id", params.userId)
    .maybeSingle();

  const { data: sessions } = await supabase
    .from("interview_sessions")
    .select("session_scores")
    .eq("user_id", params.userId)
    .eq("status", "completed")
    .not("session_scores", "is", null)
    .order("created_at", { ascending: false })
    .limit(1);

  const latestScores = sessions?.[0]?.session_scores as
    | EvaluationScores
    | undefined;
  const readinessIndex = latestScores
    ? computeReadinessIndex(latestScores)
    : null;

  const { count: sessionCount } = await supabase
    .from("interview_sessions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", params.userId)
    .eq("status", "completed");

  const { data: memories } = await supabase
    .from("coach_memory")
    .select("memory_key, memory_value")
    .eq("user_id", params.userId)
    .limit(12);

  const memoryBullets = (memories ?? []).map((m) => {
    const val = m.memory_value;
    if (typeof val === "string") return val;
    if (val && typeof val === "object" && "text" in val) {
      return String((val as { text: string }).text);
    }
    return JSON.stringify(val);
  });

  const { data: history } = await supabase
    .from("coach_messages")
    .select("role, content")
    .eq("thread_id", params.threadId)
    .order("created_at", { ascending: true })
    .limit(20);

  await supabase.from("coach_messages").insert({
    thread_id: params.threadId,
    role: "user",
    content: params.message.trim(),
  });

  const prompt = buildCoachChatPrompt({
    targetRole: profile?.target_role ?? "Software Engineer",
    readinessIndex,
    sessionCount: sessionCount ?? 0,
    memoryBullets,
    history: (history ?? []).map((h) => ({
      role: h.role as "user" | "assistant",
      content: h.content,
    })),
    userMessage: params.message.trim(),
  });

  const result = await completeWithFallback(prompt, 2048, {
    userId: params.userId,
  });
  const parsed = coachSchema.parse(JSON.parse(extractJsonObject(result.text)));

  await supabase.from("coach_messages").insert({
    thread_id: params.threadId,
    role: "assistant",
    content: parsed.reply.trim(),
  });

  for (const update of parsed.memory_updates ?? []) {
    await supabase.from("coach_memory").upsert(
      {
        user_id: params.userId,
        memory_key: update.key,
        memory_value: { text: update.value } as Json,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,memory_key" }
    );
  }

  return { reply: parsed.reply.trim(), threadId: params.threadId };
}

export async function getOrCreateCoachThread(
  userId: string
): Promise<string> {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("coach_threads")
    .select("id")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from("coach_threads")
    .insert({ user_id: userId, title: "Career coaching" })
    .select("id")
    .single();

  if (error || !created) throw new Error(error?.message ?? "Thread failed");
  return created.id;
}
