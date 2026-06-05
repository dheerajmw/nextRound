import type { InterviewMode } from "@/lib/supabase/database.types";

export const QUESTIONS_PER_SESSION = 5;
export const PRACTICE_QUESTIONS_PER_SESSION = 2;

export type InterviewDifficulty = "easy" | "medium" | "hard";
export type InterviewInputMode = "text" | "voice" | "both";
export type InterviewTurnType = "primary" | "follow_up";

/** All interview modes enabled in Phase 4 */
export const ACTIVE_INTERVIEW_MODES: InterviewMode[] = [
  "behavioral",
  "hr",
  "pm",
  "technical",
];

export const INTERVIEW_MODE_LABELS: Record<InterviewMode, string> = {
  behavioral: "Behavioral",
  hr: "HR",
  pm: "Product Manager",
  technical: "Technical",
};

export const DIFFICULTY_LABELS: Record<InterviewDifficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

export const INPUT_MODE_LABELS: Record<InterviewInputMode, string> = {
  text: "Type answers",
  voice: "Voice only",
  both: "Voice or text",
};

export const DEFAULT_TARGET_ROLE = "Software Engineer";
export const DEFAULT_MAX_FOLLOWUPS = 1;
export const DIFFICULTY_LOOKBACK_SESSIONS = 3;
