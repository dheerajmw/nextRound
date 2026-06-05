"use client";

import { useEffect } from "react";
import { AnalyticsEvents } from "@/lib/analytics/events";
import { trackEvent } from "@/components/providers/posthog-provider";
import type { ReadinessMetrics } from "@/lib/readiness/types";

export function DashboardViewTracker({
  metrics,
}: {
  metrics: ReadinessMetrics;
}) {
  useEffect(() => {
    trackEvent(AnalyticsEvents.DASHBOARD_VIEWED, {
      sessionCount: metrics.session_count,
      scoredCount: metrics.completed_scored_count,
      hasTrends: metrics.has_trends,
    });

    if (metrics.readiness_band && metrics.readiness_index != null) {
      trackEvent(AnalyticsEvents.READINESS_INDEX_BAND, {
        band: metrics.readiness_band,
        index: metrics.readiness_index,
      });
    }
  }, [metrics]);

  return null;
}
