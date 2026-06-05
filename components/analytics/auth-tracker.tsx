"use client";

import { useEffect } from "react";
import { AnalyticsEvents } from "@/lib/analytics/events";
import { identifyUser, trackEvent } from "@/components/providers/posthog-provider";

type AuthTrackerProps = {
  userId: string;
  email?: string | null;
  event: "login" | "signup";
};

export function AuthTracker({ userId, email, event }: AuthTrackerProps) {
  useEffect(() => {
    identifyUser(userId, email ? { email } : undefined);
    trackEvent(
      event === "login" ? AnalyticsEvents.LOGIN : AnalyticsEvents.SIGNUP
    );
  }, [userId, email, event]);

  return null;
}
