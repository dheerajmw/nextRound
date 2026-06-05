"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useEffect, useState } from "react";
import { AnalyticsEvents } from "@/lib/analytics/events";

let posthogInitialized = false;

function initPostHog() {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key || posthogInitialized) return false;

  posthog.init(key, {
    api_host:
      process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
    person_profiles: "identified_only",
    capture_pageview: true,
    capture_pageleave: true,
  });
  posthogInitialized = true;
  return true;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (initPostHog()) {
      setReady(true);
    }
  }, []);

  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    return <>{children}</>;
  }

  if (!ready) {
    return <>{children}</>;
  }

  return <PHProvider client={posthog}>{children}</PHProvider>;
}

export function identifyUser(userId: string, traits?: Record<string, string>) {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
  initPostHog();
  posthog.identify(userId, traits);
}

export function trackEvent(
  event: (typeof AnalyticsEvents)[keyof typeof AnalyticsEvents],
  properties?: Record<string, unknown>
) {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
  initPostHog();
  posthog.capture(event, properties);
}
