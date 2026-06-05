import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { INTERVIEW_MODE_LABELS } from "@/lib/interview/constants";
import { isMissingTableError } from "@/lib/db/schema-errors";
import { createClient } from "@/lib/supabase/server";
import type { InterviewSessionStatus } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<InterviewSessionStatus, string> = {
  draft: "Draft",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export async function SessionHistory({
  userId,
  limit = 10,
}: {
  userId: string;
  limit?: number;
}) {
  const supabase = await createClient();
  const { data: sessions, error } = await supabase
    .from("interview_sessions")
    .select("id, status, mode, target_role, session_scores, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error && isMissingTableError(error)) {
    return (
      <p className="text-sm text-muted-foreground">
        Interview history is unavailable until you run{" "}
        <span className="font-mono text-xs">db/migrations/001_initial.sql</span>{" "}
        in Supabase.
      </p>
    );
  }

  if (!sessions?.length) {
    return (
      <p className="text-sm text-muted-foreground">
        No interviews yet. Start your first mock interview below.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {sessions.map((s) => (
        <li
          key={s.id}
          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-3"
        >
          <div className="space-y-1">
            <p className="text-sm font-medium">
              {INTERVIEW_MODE_LABELS[s.mode]}
              {s.target_role ? ` · ${s.target_role}` : ""}
            </p>
            <p className="text-xs text-muted-foreground">
              {new Date(s.created_at).toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {s.status === "completed" &&
            s.session_scores &&
            typeof s.session_scores === "object" &&
            "overall" in s.session_scores ? (
              <Badge variant="outline">
                Overall {String(s.session_scores.overall)}
              </Badge>
            ) : null}
            <Badge
              variant={
                s.status === "completed"
                  ? "default"
                  : s.status === "cancelled"
                    ? "outline"
                    : "secondary"
              }
            >
              {STATUS_LABELS[s.status]}
            </Badge>
            {s.status === "cancelled" ? (
              <>
                <Link
                  href={`/interviews/${s.id}`}
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "sm" })
                  )}
                >
                  Summary
                </Link>
                <Link
                  href="/interviews/new"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" })
                  )}
                >
                  New mock
                </Link>
              </>
            ) : (
              <Link
                href={`/interviews/${s.id}`}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                {s.status === "in_progress" ? "Continue" : "View"}
              </Link>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
