import Link from "next/link";
import { PracticeMigrationNotice } from "@/components/dashboard/practice-migration-notice";
import { PracticeTaskActions } from "@/components/dashboard/practice-task-actions";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getLatestPathwayStep,
  listPracticeTasksForUser,
} from "@/lib/personalization/access";
import { formatPathwayStep } from "@/lib/personalization/pathway";
import type { PracticeTaskType } from "@/lib/personalization/types";

const TASK_TYPE_LABELS: Record<PracticeTaskType, string> = {
  retry: "Retry",
  exercise: "Exercise",
  pathway: "Pathway",
};

export async function PracticeInbox({ userId }: { userId: string }) {
  const [tasks, pathway] = await Promise.all([
    listPracticeTasksForUser(userId, { limit: 12 }),
    getLatestPathwayStep(userId),
  ]);

  const pending = tasks.filter(
    (t) => t.status === "pending" || t.status === "in_progress"
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Improvement inbox</CardTitle>
        <CardDescription>
          Personalized tasks from your latest interviews — retries, drills, and
          pathway steps.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <PracticeMigrationNotice />
        <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-sm">
          <span className="text-muted-foreground">Pathway:</span>
          <span className="font-medium">
            {formatPathwayStep(pathway.pathway_step)}
          </span>
        </div>

        {pending.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No open tasks. Complete a scored mock interview to get a practice
            plan with retries and exercises.
          </p>
        ) : (
          <ul className="space-y-3">
            {pending.map((task) => (
              <li
                key={task.id}
                className="rounded-lg border p-4 space-y-2"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">
                    {TASK_TYPE_LABELS[task.type]}
                  </Badge>
                  {task.status === "in_progress" ? (
                    <Badge variant="outline">In progress</Badge>
                  ) : null}
                  <span className="font-medium">{task.title}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {task.instructions}
                </p>
                {task.plan?.session_id ? (
                  <p className="text-xs text-muted-foreground">
                    From session{" "}
                    <Link
                      href={`/interviews/${task.plan.session_id}`}
                      className="underline underline-offset-2"
                    >
                      review
                    </Link>
                  </p>
                ) : null}
                <PracticeTaskActions
                  taskId={task.id}
                  taskType={task.type}
                  retrySessionId={task.retry_session_id}
                />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
