import { decideFollowUp } from "@/lib/interview/adaptive-policy";
import { generateFollowUpQuestion } from "@/lib/interview/generate-follow-up";
import { generateInterviewQuestion } from "@/lib/interview/generate-question";
import {
  buildPreviousTurns,
  getAnswerText,
  getTurnsForSession,
  SESSION_SELECT,
} from "@/lib/interview/session-access";
import type { InterviewSessionDto, TurnSubmitResult } from "@/lib/interview/types";
import type { InterviewTurnType } from "@/lib/interview/constants";
import { getSessionQuestionLimit } from "@/lib/interview/question-limit";
import { normalizeSession } from "@/lib/interview/normalize-session";
import { runSessionEvaluations } from "@/lib/evaluation/run-session-evaluations";
import { generatePracticePlanForSession } from "@/lib/personalization/generate-practice-plan";
import { createClient } from "@/lib/supabase/server";

export async function processAnswerSubmission(params: {
  session: InterviewSessionDto;
  sessionId: string;
  turnId: string;
  answerText: string;
  transcript?: string | null;
  audioUrl?: string | null;
  userId?: string;
}): Promise<TurnSubmitResult> {
  const supabase = await createClient();
  const { session, sessionId, turnId, answerText, transcript, audioUrl } =
    params;

  const questionLimit = getSessionQuestionLimit(session);

  const turns = await getTurnsForSession(sessionId);
  const openTurn = turns.find((t) => t.id === turnId);

  if (!openTurn) {
    throw new Error("Turn not found");
  }

  const answeredAt = new Date().toISOString();
  const finalAnswer = answerText.trim();
  const finalTranscript = transcript?.trim() || finalAnswer;

  const { error: updateError } = await supabase
    .from("interview_turns")
    .update({
      answer_text: finalAnswer,
      transcript: finalTranscript,
      audio_url: audioUrl ?? null,
      answered_at: answeredAt,
    })
    .eq("id", turnId);

  if (updateError) throw new Error(updateError.message);

  let mainCompleted = session.main_questions_completed;
  let topicFollowups = session.current_topic_followups;

  const turnType = (openTurn.turn_type ?? "primary") as InterviewTurnType;

  if (turnType === "primary") {
    mainCompleted += 1;
    topicFollowups = 0;
  }

  const targetRole = session.target_role?.trim() ?? "Software Engineer";
  const updatedTurns = await getTurnsForSession(sessionId);
  const answeredTurn = updatedTurns.find((t) => t.id === turnId)!;
  const answerForPolicy = getAnswerText(answeredTurn);

  if (mainCompleted >= questionLimit) {
    return completeSession({
      sessionId,
      session,
      mainCompleted,
      topicFollowups,
      questionLimit,
      userId: params.userId,
    });
  }

  if (turnType === "primary") {
    const followUpDecision = decideFollowUp({
      answerText: answerForPolicy,
      mode: session.mode,
      turnType: "primary",
      adaptive: session.adaptive,
      followupsUsed: topicFollowups,
      maxFollowups: session.max_followups_per_topic,
      difficulty: session.difficulty,
    });

    if (followUpDecision.shouldFollowUp && followUpDecision.reason) {
      const nextTurnIndex =
        Math.max(...updatedTurns.map((t) => t.turn_index), 0) + 1;
      const primaryIdx = openTurn.primary_question_index ?? mainCompleted - 1;

      const generated = await generateFollowUpQuestion({
        role: targetRole,
        mode: session.mode,
        difficulty: session.difficulty,
        originalQuestion: openTurn.question,
        answer: answerForPolicy,
        reason: followUpDecision.reason,
        userId: params.userId,
      });

      topicFollowups += 1;

      const { data: followTurn, error: insertError } = await supabase
        .from("interview_turns")
        .insert({
          session_id: sessionId,
          turn_index: nextTurnIndex,
          question: generated.question,
          rationale: generated.rationale,
          turn_type: "follow_up",
          primary_question_index: primaryIdx,
        })
        .select(
          "id, turn_index, question, rationale, answer_text, transcript, turn_type, primary_question_index, audio_url, created_at, answered_at"
        )
        .single();

      if (insertError || !followTurn) {
        throw new Error(insertError?.message ?? "Failed to create follow-up");
      }

      const { data: updatedSession } = await supabase
        .from("interview_sessions")
        .update({
          main_questions_completed: mainCompleted,
          current_topic_followups: topicFollowups,
        })
        .eq("id", sessionId)
        .select(SESSION_SELECT)
        .single();

      return {
        completed: false,
        session: normalizeSession(
          updatedSession as Record<string, unknown>
        )!,
        turns: await getTurnsForSession(sessionId),
        turn: followTurn as TurnSubmitResult["turn"],
        is_follow_up: true,
        adaptive_triggered: true,
        progress: {
          current: mainCompleted,
          total: questionLimit,
        },
      };
    }
  }

  const nextPrimaryIndex = mainCompleted;
  const nextTurnIndex =
    Math.max(...updatedTurns.map((t) => t.turn_index), 0) + 1;

  const generated = await generateInterviewQuestion({
    role: targetRole,
    mode: session.mode,
    questionIndex: nextPrimaryIndex,
    previousTurns: buildPreviousTurns(updatedTurns),
    difficulty: session.difficulty,
    totalQuestions: questionLimit,
    userId: params.userId,
    excludeQuestions: updatedTurns.map((t) => t.question),
    companyProfileId: session.company_profile_id ?? undefined,
  });

  const { data: nextTurn, error: insertError } = await supabase
    .from("interview_turns")
    .insert({
      session_id: sessionId,
      turn_index: nextTurnIndex,
      question: generated.question,
      rationale: generated.rationale,
      turn_type: "primary",
      primary_question_index: nextPrimaryIndex,
    })
    .select(
      "id, turn_index, question, rationale, answer_text, transcript, turn_type, primary_question_index, audio_url, created_at, answered_at"
    )
    .single();

  if (insertError || !nextTurn) {
    throw new Error(insertError?.message ?? "Failed to create next question");
  }

  const { data: updatedSession } = await supabase
    .from("interview_sessions")
    .update({
      main_questions_completed: mainCompleted,
      current_topic_followups: 0,
    })
    .eq("id", sessionId)
    .select(SESSION_SELECT)
    .single();

  return {
    completed: false,
    session: normalizeSession(updatedSession as Record<string, unknown>)!,
    turns: await getTurnsForSession(sessionId),
    turn: nextTurn as TurnSubmitResult["turn"],
    is_follow_up: false,
    adaptive_triggered: false,
    progress: {
      current: mainCompleted + 1,
      total: questionLimit,
    },
  };
}

async function completeSession(params: {
  sessionId: string;
  session: InterviewSessionDto;
  mainCompleted: number;
  topicFollowups: number;
  questionLimit: number;
  userId?: string;
}): Promise<TurnSubmitResult> {
  const supabase = await createClient();

  const { data: completedSession, error: completeError } = await supabase
    .from("interview_sessions")
    .update({
      status: "completed",
      main_questions_completed: params.mainCompleted,
      current_topic_followups: params.topicFollowups,
    })
    .eq("id", params.sessionId)
    .select(SESSION_SELECT)
    .single();

  if (completeError || !completedSession) {
    throw new Error(completeError?.message ?? "Failed to complete session");
  }

  const normalized = normalizeSession(
    completedSession as Record<string, unknown>
  )!;
  const finalTurns = await getTurnsForSession(params.sessionId);

  const baseProgress = {
    current: params.questionLimit,
    total: params.questionLimit,
  };

  try {
    const evaluation = await runSessionEvaluations({
      sessionId: params.sessionId,
      targetRole: params.session.target_role?.trim() ?? "Software Engineer",
      mode: params.session.mode,
      turns: finalTurns,
      userId: params.userId,
    });

    const result: TurnSubmitResult = {
      completed: true,
      session: {
        ...normalized,
        session_scores: evaluation.summary.scores,
      },
      turns: finalTurns,
      evaluations: evaluation.evaluations,
      evaluation_summary: evaluation.summary,
      progress: baseProgress,
    };

    await onSessionCompleted(params.sessionId, normalized, params.userId);
    return result;
  } catch (evalError) {
    const message =
      evalError instanceof Error ? evalError.message : "Evaluation failed";
    await onSessionCompleted(params.sessionId, normalized, params.userId);
    return {
      completed: true,
      session: normalized,
      turns: finalTurns,
      evaluation_error: message,
      progress: baseProgress,
    };
  }
}

async function onSessionCompleted(
  sessionId: string,
  session: InterviewSessionDto,
  userId?: string
): Promise<void> {
  const supabase = await createClient();

  const { data: row } = await supabase
    .from("interview_sessions")
    .select("user_id, practice_task_id")
    .eq("id", sessionId)
    .single();

  if (!row?.user_id) return;

  const linkedTaskId = session.practice_task_id ?? row.practice_task_id;
  if (linkedTaskId) {
    const { error: taskError } = await supabase
      .from("practice_tasks")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", linkedTaskId)
      .eq("user_id", row.user_id);
    if (!taskError) return;
  }

  try {
    await generatePracticePlanForSession({
      userId: row.user_id,
      sessionId,
    });
  } catch {
    // Plan generation is best-effort; session completion still succeeds
  }
}
