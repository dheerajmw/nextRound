"use client";

import Link from "next/link";
import { EvaluationPanel } from "@/components/interview/evaluation-panel";
import { MediaAnalysisPanel } from "@/components/vision/media-analysis-panel";
import { InterviewTracker } from "@/components/interview/interview-tracker";
import { SessionReviewTracker } from "@/components/interview/session-review-tracker";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { INTERVIEW_MODE_LABELS } from "@/lib/interview/constants";
import type { InterviewSessionDetail } from "@/lib/interview/types";
import { cn } from "@/lib/utils";

export function CompletedInterview({
  session,
  evaluationError,
}: {
  session: InterviewSessionDetail;
  evaluationError?: string | null;
}) {
  return (
    <div className="space-y-6">
      <InterviewTracker
        sessionId={session.id}
        mode={session.mode}
        event="completed"
      />
      <SessionReviewTracker sessionId={session.id} />

      <Card>
        <CardHeader>
          <CardTitle>Interview complete</CardTitle>
          <CardDescription>
            {INTERVIEW_MODE_LABELS[session.mode]} · {session.target_role}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href="/dashboard"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Back to dashboard
          </Link>
        </CardContent>
      </Card>

      <EvaluationPanel
        sessionId={session.id}
        turns={session.turns}
        evaluations={session.evaluations ?? []}
        summary={session.evaluation_summary ?? null}
        evaluationError={evaluationError}
      />

      <MediaAnalysisPanel sessionId={session.id} />
    </div>
  );
}
