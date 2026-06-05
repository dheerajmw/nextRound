"use client";

import { useEffect } from "react";

/** Links pending cohort invites to the logged-in user's email. */
export function AcceptCohortInvites() {
  useEffect(() => {
    fetch("/api/cohorts/accept-invites", { method: "POST" }).catch(() => {});
  }, []);

  return null;
}
