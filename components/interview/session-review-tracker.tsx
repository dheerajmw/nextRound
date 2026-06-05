"use client";

import { useEffect } from "react";
import { AnalyticsEvents } from "@/lib/analytics/events";
import { trackEvent } from "@/components/providers/posthog-provider";

export function SessionReviewTracker({ sessionId }: { sessionId: string }) {
  useEffect(() => {
    trackEvent(AnalyticsEvents.SESSION_REVIEWED, { sessionId });
  }, [sessionId]);

  return null;
}
