"use client";

import { useEffect } from "react";
import { AnalyticsEvents } from "@/lib/analytics/events";
import { trackEvent } from "@/components/providers/posthog-provider";
import type { InterviewMode } from "@/lib/supabase/database.types";

type InterviewTrackerProps = {
  sessionId: string;
  mode: InterviewMode;
  event: "started" | "completed";
};

export function InterviewTracker({
  sessionId,
  mode,
  event,
}: InterviewTrackerProps) {
  useEffect(() => {
    if (event === "started") {
      trackEvent(AnalyticsEvents.INTERVIEW_STARTED, { sessionId, mode });
    } else {
      trackEvent(AnalyticsEvents.INTERVIEW_COMPLETED, { sessionId, mode });
    }
  }, [sessionId, mode, event]);

  return null;
}
