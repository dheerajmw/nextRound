"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { CancelledInterview } from "@/components/interview/cancelled-interview";
import { CompletedInterview } from "@/components/interview/completed-interview";
import { InterviewTracker } from "@/components/interview/interview-tracker";
import { QuestionSpeaker } from "@/components/interview/question-speaker";
import { TtsMuteButton } from "@/components/interview/tts-mute-button";
import { VoiceAnswerControls } from "@/components/interview/voice-answer-controls";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DIFFICULTY_LABELS,
  INTERVIEW_MODE_LABELS,
} from "@/lib/interview/constants";
import { getAnswerText } from "@/lib/interview/answer-text";
import type {
  InterviewSessionDetail,
  InterviewTurnDto,
} from "@/lib/interview/types";
import type {
  SessionEvaluationSummary,
  TurnEvaluationDto,
} from "@/lib/evaluation/types";
import { AnalyticsEvents } from "@/lib/analytics/events";
import { trackEvent } from "@/components/providers/posthog-provider";

export function InterviewRoom({
  initial,
}: {
  initial: InterviewSessionDetail;
}) {
  const router = useRouter();
  const [session, setSession] = useState(initial);
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [lastAdaptive, setLastAdaptive] = useState(false);

  const openTurn =
    session.turns.find((t) => {
      const text = getAnswerText(t);
      return text.length === 0;
    }) ?? null;

  const isCompleted = session.status === "completed";
  const isCancelled = session.status === "cancelled";
  const isFollowUp = openTurn?.turn_type === "follow_up";
  const mainProgress = isFollowUp
    ? session.main_questions_completed
    : session.main_questions_completed + 1;

  const totalQuestions = session.total_questions;
  const isFinalPrimary =
    !isFollowUp &&
    session.main_questions_completed >= totalQuestions - 1;

  const voiceOnly = session.input_mode === "voice";
  const showVoice = session.input_mode === "voice" || session.input_mode === "both";
  const showText = session.input_mode === "text" || session.input_mode === "both";

  const submitAnswer = useCallback(async () => {
    if (!openTurn || answer.trim().length < 10) return;

    setSubmitting(true);
    setError(null);
    setEvaluationError(null);

    try {
      const res = await fetch(`/api/interviews/${session.id}/turns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          turn_id: openTurn.id,
          answer: answer.trim(),
          transcript: answer.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to submit answer");
        return;
      }

      setAnswer("");
      setLastAdaptive(Boolean(data.adaptive_triggered));

      if (data.adaptive_triggered) {
        trackEvent(AnalyticsEvents.ADAPTIVE_FOLLOWUP, {
          sessionId: session.id,
        });
      }

      if (data.completed) {
        setSession({
          ...session,
          status: "completed",
          turns: (data.turns ?? session.turns) as InterviewTurnDto[],
          evaluations: (data.evaluations ?? []) as TurnEvaluationDto[],
          evaluation_summary: data.evaluation_summary as
            | SessionEvaluationSummary
            | undefined,
          main_questions_completed: totalQuestions,
          total_questions: totalQuestions,
        });
        if (data.evaluation_error) {
          setEvaluationError(data.evaluation_error);
        }
        router.refresh();
        return;
      }

      if (data.session) {
        setSession({
          ...session,
          ...data.session,
          turns: data.turns ?? session.turns,
          total_questions:
            data.progress?.total ?? session.total_questions,
        });
      } else {
        const refreshRes = await fetch(`/api/interviews/${session.id}`);
        const refreshed = await refreshRes.json();
        if (refreshRes.ok) {
          setSession({
            ...refreshed.session,
            turns: refreshed.turns,
            total_questions: refreshed.total_questions,
            evaluations: refreshed.evaluations,
            evaluation_summary: refreshed.evaluation_summary,
          });
        }
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [answer, openTurn, router, session, totalQuestions]);

  const cancelSession = useCallback(async () => {
    const confirmed = window.confirm(
      "End this mock early?\n\nThe session will be marked cancelled (no score). Your next mock will use fresh questions."
    );
    if (!confirmed) return;

    setCancelling(true);
    setError(null);

    try {
      const res = await fetch(`/api/interviews/${session.id}/cancel`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to cancel session");
        return;
      }

      router.push("/interviews/new");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setCancelling(false);
    }
  }, [router, session.id]);

  if (isCancelled) {
    return <CancelledInterview session={session} />;
  }

  if (isCompleted) {
    return (
      <CompletedInterview
        session={session}
        evaluationError={evaluationError}
      />
    );
  }

  if (!openTurn) {
    return (
      <Card>
        <CardContent className="py-8 text-sm text-muted-foreground">
          Loading interview…
        </CardContent>
      </Card>
    );
  }

  const isFirstQuestion =
    session.main_questions_completed === 0 &&
    openTurn.turn_index === 0;

  return (
    <div className="space-y-6">
      {isFirstQuestion ? (
        <InterviewTracker
          sessionId={session.id}
          mode={session.mode}
          event="started"
        />
      ) : null}

      {lastAdaptive ? (
        <p className="text-sm text-primary">
          Adaptive follow-up — the interviewer is probing your last answer
          before moving on.
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">
            {INTERVIEW_MODE_LABELS[session.mode]}
          </Badge>
          <Badge variant="outline">{session.target_role}</Badge>
          <Badge variant="outline">
            {DIFFICULTY_LABELS[session.difficulty]}
          </Badge>
          {session.adaptive ? (
            <Badge variant="secondary">Adaptive</Badge>
          ) : null}
          {isFollowUp ? (
            <Badge>Follow-up</Badge>
          ) : null}
          <span className="text-sm text-muted-foreground">
            Question {mainProgress} of {totalQuestions}
          </span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-destructive"
          disabled={submitting || cancelling}
          onClick={cancelSession}
        >
          {cancelling ? "Ending…" : "Exit mock"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg leading-relaxed">
            {openTurn.question}
          </CardTitle>
          {openTurn.rationale ? (
            <CardDescription>{openTurn.rationale}</CardDescription>
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            <QuestionSpeaker
              question={openTurn.question}
              autoSpeak={showVoice && session.input_mode !== "text"}
            />
            {showVoice ? <TtsMuteButton /> : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {showVoice ? (
            <VoiceAnswerControls
              value={answer}
              onChange={setAnswer}
              disabled={submitting}
              voiceOnly={voiceOnly}
            />
          ) : null}

          {showText && !showVoice ? (
            <div className="space-y-2">
              <Label htmlFor="answer">Your answer</Label>
              <Textarea
                id="answer"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type your response here…"
                rows={8}
                disabled={submitting}
              />
            </div>
          ) : null}

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <Button
            type="button"
            disabled={submitting || cancelling || answer.trim().length < 10}
            onClick={submitAnswer}
          >
            {submitting
              ? isFinalPrimary
                ? "Submitting & evaluating…"
                : "Submitting…"
              : isFinalPrimary
                ? "Submit final answer"
                : isFollowUp
                  ? "Submit follow-up"
                  : "Submit & next question"}
          </Button>
          <p className="text-xs text-muted-foreground">
            Minimum 10 characters per answer.
            {voiceOnly
              ? " Use Chrome or Edge for voice recognition."
              : null}
            {isFinalPrimary
              ? " Your answers will be scored when you finish."
              : null}
          </p>
        </CardContent>
      </Card>

      {session.turns.filter((t) => getAnswerText(t).length > 0).length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Previous answers</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-4">
              {session.turns
                .filter((t) => getAnswerText(t).length > 0)
                .map((turn) => (
                  <li
                    key={turn.id}
                    className="border-b pb-4 last:border-0 text-sm"
                  >
                    <p className="text-xs font-medium text-muted-foreground">
                      {turn.turn_type === "follow_up"
                        ? "Follow-up"
                        : `Question ${(turn.primary_question_index ?? 0) + 1}`}
                    </p>
                    <p className="mt-1 font-medium">{turn.question}</p>
                    <p className="mt-2 text-muted-foreground whitespace-pre-wrap">
                      {getAnswerText(turn)}
                    </p>
                  </li>
                ))}
            </ol>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
