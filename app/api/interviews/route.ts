import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/api/auth";
import { hasLlmKeys } from "@/lib/env";
import { resolveDifficultyForUser } from "@/lib/interview/difficulty";
import {
  ACTIVE_INTERVIEW_MODES,
  DEFAULT_MAX_FOLLOWUPS,
  DEFAULT_TARGET_ROLE,
} from "@/lib/interview/constants";
import { getSessionQuestionLimit } from "@/lib/interview/question-limit";
import { SESSION_SELECT } from "@/lib/interview/session-access";
import { formatLlmApiError } from "@/lib/llm/format-api-error";
import { getLlmErrorStatus } from "@/lib/llm/client";
import { generateInterviewQuestion } from "@/lib/interview/generate-question";
import { getExcludedQuestionsForNewSession } from "@/lib/interview/excluded-questions";
import { normalizeSession } from "@/lib/interview/normalize-session";
import type { InterviewSessionDto } from "@/lib/interview/types";
import { schemaUnavailableBody } from "@/lib/db/schema-errors";
import { createClient } from "@/lib/supabase/server";
import type { InterviewMode } from "@/lib/supabase/database.types";

const createSchema = z.object({
  mode: z.enum(["behavioral", "hr", "pm", "technical"]),
  target_role: z.string().min(2).max(120).optional(),
  adaptive: z.boolean().optional().default(true),
  input_mode: z.enum(["text", "voice", "both"]).optional().default("both"),
  max_followups_per_topic: z.number().int().min(0).max(2).optional(),
  company_profile_id: z.string().uuid().optional(),
  peer_session_id: z.string().uuid().optional(),
});

export async function GET() {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("interview_sessions")
    .select(
      "id, status, mode, target_role, session_scores, adaptive, difficulty, input_mode, created_at, updated_at"
    )
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    const schema = schemaUnavailableBody(error);
    if (schema) return NextResponse.json(schema, { status: 503 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ sessions: data ?? [] });
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  if (!hasLlmKeys()) {
    return NextResponse.json(
      {
        error: "LLM not configured",
        hint: "Set GEMINI_API_KEY and/or OPENROUTER_API_KEY",
      },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const {
    mode,
    target_role: targetRoleInput,
    adaptive,
    input_mode: inputMode,
    max_followups_per_topic: maxFollowups,
    company_profile_id: companyProfileId,
    peer_session_id: peerSessionId,
  } = parsed.data;

  if (!ACTIVE_INTERVIEW_MODES.includes(mode as InterviewMode)) {
    return NextResponse.json(
      { error: `Mode ${mode} is not supported` },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("target_role")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  const targetRole =
    targetRoleInput?.trim() ||
    profile?.target_role?.trim() ||
    DEFAULT_TARGET_ROLE;

  if (targetRoleInput?.trim()) {
    await supabase
      .from("profiles")
      .update({ target_role: targetRoleInput.trim() })
      .eq("user_id", auth.user.id);
  }

  const difficulty = await resolveDifficultyForUser(auth.user.id);

  const excludeQuestions = await getExcludedQuestionsForNewSession({
    userId: auth.user.id,
    mode: mode as InterviewMode,
    targetRole,
    companyProfileId,
  });

  const { data: session, error: sessionError } = await supabase
    .from("interview_sessions")
    .insert({
      user_id: auth.user.id,
      status: "in_progress",
      mode,
      target_role: targetRole,
      adaptive,
      difficulty,
      input_mode: inputMode,
      max_followups_per_topic: maxFollowups ?? DEFAULT_MAX_FOLLOWUPS,
      main_questions_completed: 0,
      current_topic_followups: 0,
      company_profile_id: companyProfileId ?? null,
    })
    .select(SESSION_SELECT)
    .single();

  if (sessionError || !session) {
    const schema = schemaUnavailableBody(sessionError);
    if (schema) return NextResponse.json(schema, { status: 503 });
    return NextResponse.json(
      { error: sessionError?.message ?? "Failed to create session" },
      { status: 500 }
    );
  }

  try {
    const generated = await generateInterviewQuestion({
      role: targetRole,
      mode,
      questionIndex: 0,
      previousTurns: [],
      difficulty,
      userId: auth.user.id,
      companyProfileId: companyProfileId,
      excludeQuestions,
    });

    if (peerSessionId) {
      const { linkInterviewToPeerSession } = await import(
        "@/lib/vision/peer-sessions"
      );
      await linkInterviewToPeerSession({
        peerSessionId,
        userId: auth.user.id,
        interviewSessionId: session.id,
      });
    }

    const { data: turn, error: turnError } = await supabase
      .from("interview_turns")
      .insert({
        session_id: session.id,
        turn_index: 0,
        question: generated.question,
        rationale: generated.rationale,
        turn_type: "primary",
        primary_question_index: 0,
      })
      .select(
        "id, turn_index, question, rationale, answer_text, transcript, turn_type, primary_question_index, audio_url, created_at, answered_at"
      )
      .single();

    if (turnError || !turn) {
      await supabase.from("interview_sessions").delete().eq("id", session.id);
      return NextResponse.json(
        { error: turnError?.message ?? "Failed to create first question" },
        { status: 500 }
      );
    }

    const normalized = normalizeSession(
      session as Record<string, unknown>
    )!;
    const questionLimit = getSessionQuestionLimit(normalized);

    return NextResponse.json({
      session: normalized as InterviewSessionDto,
      turn,
      progress: {
        current: 1,
        total: questionLimit,
      },
      difficulty,
    });
  } catch (error) {
    await supabase.from("interview_sessions").delete().eq("id", session.id);
    if (error instanceof Error && error.name === "OrgLlmCapExceededError") {
      return NextResponse.json({ error: error.message }, { status: 429 });
    }
    const message = formatLlmApiError(error);
    return NextResponse.json(
      { error: message },
      { status: getLlmErrorStatus(error) }
    );
  }
}
