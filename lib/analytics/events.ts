/** PostHog event names — extend in later phases; do not rename existing events. */
export const AnalyticsEvents = {
  SIGNUP: "signup",
  LOGIN: "login",
  INTERVIEW_STARTED: "interview_started",
  INTERVIEW_COMPLETED: "interview_completed",
  EVALUATION_RECEIVED: "evaluation_received",
  DASHBOARD_VIEWED: "dashboard_viewed",
  SESSION_REVIEWED: "session_reviewed",
  READINESS_INDEX_BAND: "readiness_index_band",
  ADAPTIVE_FOLLOWUP: "adaptive_followup",
  PRACTICE_PLAN_CREATED: "practice_plan_created",
  PRACTICE_TASK_COMPLETED: "practice_task_completed",
  PRACTICE_RETRY_STARTED: "practice_retry_started",
  RESUME_SKILLS_EXTRACTED: "resume_skills_extracted",
  QUESTION_FROM_BANK: "question_from_bank",
  COHORT_INVITE_SENT: "cohort_invite_sent",
  ORG_CREATED: "org_created",
  MEDIA_ANALYSIS_COMPLETED: "media_analysis_completed",
  PEER_SESSION_CREATED: "peer_session_created",
  COACH_MESSAGE_SENT: "coach_message_sent",
  COMPANY_INTERVIEW_STARTED: "company_interview_started",
} as const;

export type AnalyticsEventName =
  (typeof AnalyticsEvents)[keyof typeof AnalyticsEvents];
