import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DashboardViewTracker } from "@/components/dashboard/dashboard-view-tracker";
import { ReadinessTrendCharts } from "@/components/dashboard/readiness-trend-charts";
import { ReadinessThemes } from "@/components/dashboard/readiness-themes";
import { SessionComparison } from "@/components/dashboard/session-comparison";
import { ScoreGrid } from "@/components/interview/score-display";
import { MIN_SESSIONS_FOR_TRENDS } from "@/lib/readiness/constants";
import { getReadinessMetrics } from "@/lib/readiness/get-readiness";
import { Badge } from "@/components/ui/badge";

export async function ReadinessDashboard({ userId }: { userId: string }) {
  const metrics = await getReadinessMetrics(userId);

  return (
    <div className="space-y-6">
      <DashboardViewTracker metrics={metrics} />

      <div className="grid grid-cols-12 gap-4">
        <Card className="col-span-12 sm:col-span-6 lg:col-span-3">
          <CardHeader className="pb-2">
            <CardDescription className="nr-label-caps text-[10px]">
              Readiness index
            </CardDescription>
            <CardTitle className="text-3xl tabular-nums text-primary">
              {metrics.readiness_index ?? "—"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.readiness_band ? (
              <Badge variant="secondary" className="capitalize font-mono text-xs">
                {metrics.readiness_band} readiness
              </Badge>
            ) : (
              <p className="font-mono text-xs text-muted-foreground">
                Complete a scored interview
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-12 sm:col-span-6 lg:col-span-3">
          <CardHeader className="pb-2">
            <CardDescription className="nr-label-caps text-[10px]">
              Interviews
            </CardDescription>
            <CardTitle className="text-3xl tabular-nums">
              {metrics.session_count}
            </CardTitle>
          </CardHeader>
          <CardContent className="font-mono text-xs text-muted-foreground">
            {metrics.completed_scored_count} scored & completed
          </CardContent>
        </Card>

        <Card className="col-span-12 sm:col-span-6 lg:col-span-3">
          <CardHeader className="pb-2">
            <CardDescription className="nr-label-caps text-[10px]">
              Consistency
            </CardDescription>
            <CardTitle className="text-3xl tabular-nums">
              {metrics.consistency_score ?? "—"}
            </CardTitle>
          </CardHeader>
          <CardContent className="font-mono text-xs text-muted-foreground">
            {metrics.consistency_label
              ? `${metrics.consistency_label} (lower score variance)`
              : "Need 2+ scored sessions"}
          </CardContent>
        </Card>

        <Card className="col-span-12 sm:col-span-6 lg:col-span-3">
          <CardHeader className="pb-2">
            <CardDescription className="nr-label-caps text-[10px]">
              Avg communication
            </CardDescription>
            <CardTitle className="text-3xl tabular-nums">
              {metrics.current?.communication ?? "—"}
            </CardTitle>
          </CardHeader>
          <CardContent className="font-mono text-xs text-muted-foreground">
            Rolling average across scored sessions
          </CardContent>
        </Card>
      </div>

      {metrics.current ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Average dimension scores</CardTitle>
            <CardDescription>
              Mean across all completed, scored sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScoreGrid scores={metrics.current} compact />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Score trends</CardTitle>
          <CardDescription>
            Communication, overall, and readiness index per session
          </CardDescription>
        </CardHeader>
        <CardContent>
          {metrics.has_trends ? (
            <ReadinessTrendCharts trends={metrics.trends} />
          ) : (
            <p className="text-sm text-muted-foreground">
              Complete{" "}
              <strong>
                {MIN_SESSIONS_FOR_TRENDS - metrics.completed_scored_count}
              </strong>{" "}
              more scored interview
              {MIN_SESSIONS_FOR_TRENDS - metrics.completed_scored_count === 1
                ? ""
                : "s"}{" "}
              to unlock trend charts ({metrics.completed_scored_count}/
              {MIN_SESSIONS_FOR_TRENDS}).
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Strengths & weaknesses</CardTitle>
          <CardDescription>
            Top recurring themes from your evaluation feedback
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReadinessThemes
            strengths={metrics.top_strengths}
            weaknesses={metrics.top_weaknesses}
          />
        </CardContent>
      </Card>

      {metrics.session_comparison.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Session comparison</CardTitle>
            <CardDescription>
              Historical scores — newest first
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SessionComparison sessions={metrics.session_comparison} />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
