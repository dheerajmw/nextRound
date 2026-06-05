"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AnalyticsEvents } from "@/lib/analytics/events";
import { trackEvent } from "@/components/providers/posthog-provider";
import type { PracticeTaskType } from "@/lib/personalization/types";

type Props = {
  taskId: string;
  taskType: PracticeTaskType;
  retrySessionId: string | null;
};

export function PracticeTaskActions({
  taskId,
  taskType,
  retrySessionId,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function markComplete() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/practice/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to update task");
        return;
      }
      trackEvent(AnalyticsEvents.PRACTICE_TASK_COMPLETED, {
        taskId,
        taskType,
      });
      router.refresh();
    } catch {
      setError("Failed to update task");
    } finally {
      setLoading(false);
    }
  }

  async function startRetry() {
    if (retrySessionId) {
      router.push(`/interviews/${retrySessionId}`);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/practice/tasks/${taskId}/start`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to start practice");
        return;
      }
      trackEvent(AnalyticsEvents.PRACTICE_RETRY_STARTED, { taskId });
      router.push(data.redirect ?? `/interviews/${data.session_id}`);
    } catch {
      setError("Failed to start practice");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {taskType === "retry" ? (
        <Button size="sm" onClick={startRetry} disabled={loading}>
          {retrySessionId ? "Continue retry" : "Start retry"}
        </Button>
      ) : null}
      <Button
        size="sm"
        variant="outline"
        onClick={markComplete}
        disabled={loading}
      >
        Mark done
      </Button>
      {error ? (
        <p className="w-full text-xs text-destructive">{error}</p>
      ) : null}
    </div>
  );
}
