"use client";

import { useEffect } from "react";
import { AnalyticsEvents } from "@/lib/analytics/events";
import { trackEvent } from "@/components/providers/posthog-provider";

export function EvaluationTracker({
  sessionId,
  turnCount,
}: {
  sessionId: string;
  turnCount: number;
}) {
  useEffect(() => {
    trackEvent(AnalyticsEvents.EVALUATION_RECEIVED, {
      sessionId,
      turnCount,
    });
  }, [sessionId, turnCount]);

  return null;
}
