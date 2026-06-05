import Link from "next/link";
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

export function CancelledInterview({
  session,
}: {
  session: InterviewSessionDetail;
}) {
  const answeredCount = session.turns.filter(
    (t) => (t.answer_text?.trim() || t.transcript?.trim() || "").length > 0
  ).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mock interview cancelled</CardTitle>
        <CardDescription>
          {INTERVIEW_MODE_LABELS[session.mode]}
          {session.target_role ? ` · ${session.target_role}` : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          This session was ended early. It was not scored.
          {answeredCount > 0
            ? ` You answered ${answeredCount} question${answeredCount === 1 ? "" : "s"} before exiting.`
            : " No answers were submitted."}{" "}
          Your next mock will use different questions.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/interviews/new"
            className={cn(buttonVariants(), "font-mono text-[13px] font-bold")}
          >
            Start new mock
          </Link>
          <Link
            href="/dashboard"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Dashboard
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
